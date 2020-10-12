import type { IActionRdfResolveQuadPattern,
  IActorRdfResolveQuadPatternOutput, IQuadSource } from '@comunica/bus-rdf-resolve-quad-pattern';
import {
  ActorRdfResolveQuadPatternSource, KEY_CONTEXT_SOURCE,
} from '@comunica/bus-rdf-resolve-quad-pattern';
import type { ActionContext, IActorArgs, IActorTest } from '@comunica/core';
import type * as RDF from 'rdf-js';
import { OstrichQuadSource } from './OstrichQuadSource';
// TODO: Create OSTRICH typings
const ostrich = require('ostrich-bindings');
/**
 * A comunica OSTRICH RDF Resolve Quad Pattern Actor.
 */
export class ActorRdfResolveQuadPatternOstrich extends ActorRdfResolveQuadPatternSource
  implements IActorRdfResolveQuadPatternOstrichArgs {
  public readonly ostrichFiles?: string[];
  public ostrichDocuments: Record<string, Promise<any>> = {};
  public closed = false;

  protected shouldClose: boolean;
  protected queries = 0;

  public constructor(args: IActorRdfResolveQuadPatternOstrichArgs) {
    super(args);
  }

  public initializeOstrich(ostrichPath: string): Promise<any> {
    // eslint-disable-next-line no-return-assign
    return this.ostrichDocuments[ostrichPath] = new Promise((resolve, reject) => {
      ostrich.fromPath(ostrichPath, (error: Error, ostrichStore: any) => {
        if (error) {
          return reject(error);
        }
        resolve(ostrichStore);
      });
    });
  }

  public async initialize(): Promise<any> {
    (this.ostrichFiles || []).forEach(ostrichFile => this.initializeOstrich(ostrichFile));
    return null;
  }

  public async deinitialize(): Promise<any> {
    process.on('exit', () => this.safeClose());
    process.on('SIGINT', () => this.safeClose());
    return null;
  }

  public close(): void {
    if (this.closed) {
      throw new Error('This actor can only be closed once.');
    }
    if (!this.queries) {
      this.shouldClose = false;
      Object.keys(this.ostrichDocuments).forEach(
        async ostrichFile => (await this.ostrichDocuments[ostrichFile]).close(),
      );
      this.closed = true;
    } else {
      this.shouldClose = true;
    }
  }

  public async test(action: IActionRdfResolveQuadPattern): Promise<IActorTest> {
    if (!action.context || !action.context.has(KEY_CONTEXT_SOURCE) ||
      action.context.get(KEY_CONTEXT_SOURCE).type !== 'ostrichFile' ||
      !action.context.get(KEY_CONTEXT_SOURCE).value) {
      throw new Error(`${this.name} requires a single source with a ostrichFile to be present in the context.`);
    }
    if (action.pattern.graph.termType !== 'DefaultGraph') {
      throw new Error(`${this.name} can only perform versioned queries in the default graph.`);
    }
    if (action.context.has(KEY_CONTEXT_VERSION) &&
      (action.context.get(KEY_CONTEXT_VERSION).type !== 'version-materialization' &&
      action.context.get(KEY_CONTEXT_VERSION).type !== 'delta-materialization' &&
      action.context.get(KEY_CONTEXT_VERSION).type !== 'version-query')) {
      throw new Error(`${this.name} requires a version context.`);
    }
    return true;
  }

  protected safeClose(): void {
    if (!this.closed) {
      this.close();
    }
  }

  protected async getSource(context: ActionContext): Promise<IQuadSource> {
    const ostrichFile: string = context.get(KEY_CONTEXT_SOURCE).value;
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    if (!this.ostrichDocuments[ostrichFile]) {
      await this.initializeOstrich(ostrichFile);
    }
    return new OstrichQuadSource(await this.ostrichDocuments[ostrichFile]);
  }

  protected async getOutput(
    source: IQuadSource,
    pattern: RDF.Quad,
    context: ActionContext,
  ): Promise<IActorRdfResolveQuadPatternOutput> {
    // Attach totalItems to the output
    this.queries++;
    (<OstrichQuadSource> source).setVersionContext(context.get(KEY_CONTEXT_VERSION) ||
      { type: 'version-materialization', version: -1 });
    const output: IActorRdfResolveQuadPatternOutput = await super.getOutput(source, pattern, context);
    output.data.on('end', () => {
      this.queries--;
      if (this.shouldClose) {
        this.close();
      }
    });
    return output;
  }
}

export interface IActorRdfResolveQuadPatternOstrichArgs
  extends IActorArgs<IActionRdfResolveQuadPattern, IActorTest, IActorRdfResolveQuadPatternOutput> {
  /**
   * The OSTRICH files to preload.
   */
  ostrichFiles?: string[];
}

export type VersionContext = IVersionContextVersionMaterialization | IVersionContextDm | IVersionContextVersionQuery;

/**
 * Context for a single version.
 */
export interface IVersionContextVersionMaterialization {
  type: 'version-materialization';
  version: number;
}

/**
 * Context for the delta between two versions.
 */
export interface IVersionContextDm {
  type: 'delta-materialization';
  versionStart: number;
  versionEnd: number;
  /**
   * If only additions must be returned, otherwise, only deletions will be returned.
   */
  queryAdditions: boolean;
}

/**
 * Context for all versions.
 */
export interface IVersionContextVersionQuery {
  type: 'version-query';
}

/**
 * @type {string} Context entry for a version.
 * @value {IDataSource} A source.
 */
export const KEY_CONTEXT_VERSION = '@comunica/actor-query-operation-contextify-version:version';
