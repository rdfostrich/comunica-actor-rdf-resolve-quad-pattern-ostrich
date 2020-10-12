import { DataFactory } from 'rdf-data-factory';
import { OstrichIterator } from '../lib/OstrichIterator';
import { OstrichQuadSource } from '../lib/OstrichQuadSource';
import { MockedOstrichDocument } from '../mocks/MockedOstrichDocument';
const arrayifyStream = require('arrayify-stream');
const DF = new DataFactory();

describe('OstrichQuadSource', () => {
  let ostrichDocument;

  beforeEach(() => {
    ostrichDocument = new MockedOstrichDocument({
      0: [
        t('s0', 'p1', 'o1'),
        t('s0', 'p1', 'o2'),
      ],
      1: [
        t('s1', 'p1', 'o1'),
        t('s1', 'p1', 'o2'),
      ],
      2: [
        t('s2', 'p1', 'o1'),
        t('s2', 'p1', 'o2'),
      ],
      3: [
        t('s2', 'p1', 'o1'),
        t('s2', 'p1', 'o2'),
      ],
    });
  });

  describe('The OstrichQuadSource module', () => {
    it('should be a function', () => {
      expect(OstrichQuadSource).toBeInstanceOf(Function);
    });

    it('should be a OstrichQuadSource constructor', () => {
      expect(new OstrichQuadSource(ostrichDocument)).toBeInstanceOf(OstrichQuadSource);
    });
  });

  describe('A OstrichQuadSource instance', () => {
    let source: OstrichQuadSource;

    beforeEach(() => {
      source = new OstrichQuadSource(ostrichDocument);
    });

    it('should throw an error when queried on the non-default graph', () => {
      return expect(() => source.match(null, null, null, DF.namedNode('http://ex.org'))).toThrow();
    });

    it('should return a OstrichIterator', () => {
      source.setVersionContext({ type: 'version-materialization', version: 0 });
      return expect(source.match(DF.variable('v'), DF.variable('v'), DF.variable('v'), DF.defaultGraph()))
        .toBeInstanceOf(OstrichIterator);
    });

    it('should count VM', () => {
      source.setVersionContext({ type: 'version-materialization', version: 0 });
      return expect(source.count(DF.variable('v'), DF.variable('v'), DF.variable('v'))).resolves.toBe(2);
    });

    it('should count DM', () => {
      source.setVersionContext(
        { type: 'delta-materialization', versionStart: 0, versionEnd: 1, queryAdditions: false },
      );
      return expect(source.count(DF.variable('v'), DF.variable('v'), DF.variable('v'))).resolves.toBe(4);
    });

    it('should count VQ', () => {
      source.setVersionContext({ type: 'version-query' });
      return expect(source.count(DF.variable('v'), DF.variable('v'), DF.variable('v'))).resolves.toBe(8);
    });

    it('should delegate count errors', () => {
      source.setVersionContext({ type: 'version-query' });
      ostrichDocument.countTriplesVersion = (s, p, o, done) => {
        done(new Error('e'));
      };
      return expect(source.count(DF.variable('v'), DF.variable('v'), DF.variable('v'))).rejects.toEqual(new Error('e'));
    });

    it('should delegate count errors to match', () => {
      source.setVersionContext({ type: 'version-query' });
      ostrichDocument.countTriplesVersion = (s, p, o, done) => {
        done(new Error('e'));
      };
      return expect(arrayifyStream(source
        .match(DF.variable('v'), DF.variable('v'), DF.variable('v'), DF.defaultGraph())))
        .rejects.toEqual(new Error('e'));
    });
  });
});

function t(subject, predicate, object) {
  return { subject, predicate, object };
}
