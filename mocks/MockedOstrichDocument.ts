import type { IStringQuad } from 'rdf-string/lib/TermUtil';

export class MockedOstrichDocument {
  public closed = false;

  private readonly triples: Record<number, IStringQuad[]>;
  private error: Error = null;

  public constructor(triples: Record<number, IStringQuad[]>) {
    this.triples = triples;
  }

  protected static triplesMatch(left: IStringQuad, right: IStringQuad): boolean {
    return MockedOstrichDocument.termsMatch(left.subject, right.subject) &&
      MockedOstrichDocument.termsMatch(left.predicate, right.predicate) &&
      MockedOstrichDocument.termsMatch(left.object, right.object);
  }

  protected static termsMatch(left: string, right: string): boolean {
    return MockedOstrichDocument.isVariable(left) || MockedOstrichDocument.isVariable(right) || left === right;
  }

  protected static isVariable(term: string): boolean {
    return !term || term.startsWith('?') || term.startsWith('_');
  }

  public searchTriplesVersionMaterialized(subject: string, predicate: string, object: string,
    options: Record<string, any>,
    cb: (error: Error, triples: IStringQuad[], totalItems: number) => void): void {
    if (this.error) {
      return cb(this.error, null, 0);
    }
    const tripleIn = { subject, predicate, object };
    const version = options.version === -1 ? Object.keys(this.triples).length - 1 : options.version;
    let i = 0;
    const triples: IStringQuad[] = [];
    for (const triple of this.triples[version]) {
      if (MockedOstrichDocument.triplesMatch(tripleIn, triple)) {
        triples.push(triple);
        i++;
      }
    }
    cb(null, triples, i);
  }

  public countTriplesVersionMaterialized(subject: string, predicate: string, object: string, version: number,
    cb: (error: Error, totalItems: number) => any): void {
    this.searchTriplesVersionMaterialized(subject,
      predicate,
      object,
      { version },
      (error: Error, triples: IStringQuad[]) => {
        cb(error, triples.length);
      });
  }

  public searchTriplesDeltaMaterialized(subject: string, predicate: string, object: string,
    options: Record<string, any>,
    cb: (error: Error, triples: IStringQuad[], totalItems: number) => void): void {
    if (this.error) {
      return cb(this.error, null, 0);
    }
    const tripleIn = { subject, predicate, object };
    const versionStart = options.versionStart;
    const versionEnd = options.versionEnd;

    const triplesStart: IStringQuad[] = [];
    for (const triple of this.triples[versionStart]) {
      if (MockedOstrichDocument.triplesMatch(tripleIn, triple)) {
        triplesStart.push(triple);
      }
    }
    const triplesEnd: IStringQuad[] = [];
    for (const triple of this.triples[versionEnd]) {
      if (MockedOstrichDocument.triplesMatch(tripleIn, triple)) {
        triplesEnd.push(triple);
      }
    }

    const triplesDiff: IStringQuad[] = [];
    // Find deletions
    for (const tripleStart of triplesStart) {
      let found = false;
      for (const tripleEnd of triplesEnd) {
        if (MockedOstrichDocument.triplesMatch(tripleStart, tripleEnd)) {
          found = true;
          break;
        }
      }
      if (!found) {
        (<any> tripleStart).addition = false;
        triplesDiff.push(tripleStart);
      }
    }
    // Find additions
    for (const tripleEnd of triplesEnd) {
      let found = false;
      for (const tripleStart of triplesStart) {
        if (MockedOstrichDocument.triplesMatch(tripleStart, tripleEnd)) {
          found = true;
          break;
        }
      }
      if (!found) {
        (<any> tripleEnd).addition = true;
        triplesDiff.push(tripleEnd);
      }
    }

    cb(null, triplesDiff, triplesDiff.length);
  }

  public countTriplesDeltaMaterialized(subject: string, predicate: string, object: string,
    versionStart: number, versionEnd: number,
    cb: (error: Error, totalItems: number) => any): void {
    this.searchTriplesDeltaMaterialized(subject,
      predicate,
      object,
      { versionStart, versionEnd },
      (error: Error, triples: IStringQuad[]) => {
        cb(error, triples.length);
      });
  }

  public searchTriplesVersion(subject: string, predicate: string, object: string,
    options: Record<string, any>,
    cb: (error: Error, triples: IStringQuad[], totalItems: number) => void): void {
    if (this.error) {
      return cb(this.error, null, 0);
    }
    const tripleIn = { subject, predicate, object };
    let i = 0;
    const triples: IStringQuad[] = [];
    for (const version in this.triples) {
      for (const triple of this.triples[version]) {
        if (MockedOstrichDocument.triplesMatch(tripleIn, triple)) {
          (<any> triple).versions = [ version ];
          triples.push(triple);
          i++;
        }
      }
    }
    cb(null, triples, i);
  }

  public countTriplesVersion(subject: string, predicate: string, object: string,
    cb: (error: Error, totalItems: number) => any): void {
    this.searchTriplesVersion(subject, predicate, object, {}, (error: Error, triples: IStringQuad[]) => {
      cb(error, triples.length);
    });
  }

  public close(): void {
    this.closed = true;
  }

  public setError(error: Error): void {
    this.error = error;
  }
}
