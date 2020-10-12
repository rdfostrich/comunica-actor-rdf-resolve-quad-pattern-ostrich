import { DataFactory } from 'rdf-data-factory';
import type { VersionContext } from '../lib/ActorRdfResolveQuadPatternOstrich';
import { OstrichIterator } from '../lib/OstrichIterator';
import { MockedOstrichDocument } from '../mocks/MockedOstrichDocument';
const arrayifyStream = require('arrayify-stream');
const quad = require('rdf-quad');
const DF = new DataFactory();

describe('OstrichIterator', () => {
  const vm0: VersionContext = { type: 'version-materialization', version: 0 };
  const dm01A: VersionContext = { type: 'delta-materialization', versionStart: 0, versionEnd: 1, queryAdditions: true };
  const dm23A: VersionContext = { type: 'delta-materialization', versionStart: 2, versionEnd: 3, queryAdditions: true };
  const dm01D: VersionContext = {
    type: 'delta-materialization',
    versionStart: 0,
    versionEnd: 1,
    queryAdditions: false,
  };
  const dm23D: VersionContext = {
    type: 'delta-materialization',
    versionStart: 2,
    versionEnd: 3,
    queryAdditions: false,
  };
  const vq: VersionContext = { type: 'version-query' };
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

  it('should be instantiatable', () => {
    return expect(() => new OstrichIterator(ostrichDocument,
      vm0,
      DF.namedNode('s1'),
      DF.namedNode('p1'),
      DF.namedNode('o1'),
      { offset: 0, limit: 10 })).not.toThrow();
  });

  it('should return the correct stream for ? ? ? VM 0', async() => {
    expect(await arrayifyStream(new OstrichIterator(ostrichDocument,
      vm0,
      DF.variable('s'),
      DF.variable('p'),
      DF.variable('o'),
      {}))).toEqual([
      quad('s0', 'p1', 'o1'),
      quad('s0', 'p1', 'o2'),
    ]);
  });

  it('should return the correct stream for ? ? ? DM 0-1 (+)', async() => {
    expect(await arrayifyStream(new OstrichIterator(ostrichDocument,
      dm01A,
      DF.variable('s'),
      DF.variable('p'),
      DF.variable('o'),
      {}))).toEqual([
      quad('s1', 'p1', 'o1'),
      quad('s1', 'p1', 'o2'),
    ]);
  });

  it('should return the correct stream for s0 ? ? DM 0-1 (+)', async() => {
    expect(await arrayifyStream(new OstrichIterator(ostrichDocument,
      dm01A,
      DF.namedNode('s0'),
      DF.variable('p'),
      DF.variable('o'),
      {}))).toEqual([]);
  });

  it('should return the correct stream for s1 ? ? DM 0-1 (+)', async() => {
    expect(await arrayifyStream(new OstrichIterator(ostrichDocument,
      dm01A,
      DF.namedNode('s1'),
      DF.variable('p'),
      DF.variable('o'),
      {}))).toEqual([
      quad('s1', 'p1', 'o1'),
      quad('s1', 'p1', 'o2'),
    ]);
  });

  it('should return the correct stream for ? ? ? DM 2-3 (+)', async() => {
    expect(await arrayifyStream(new OstrichIterator(ostrichDocument,
      dm23A,
      DF.variable('s'),
      DF.variable('p'),
      DF.variable('o'),
      {}))).toEqual([]);
  });

  it('should return the correct stream for ? ? ? DM 0-1 (-)', async() => {
    expect(await arrayifyStream(new OstrichIterator(ostrichDocument,
      dm01D,
      DF.variable('s'),
      DF.variable('p'),
      DF.variable('o'),
      {}))).toEqual([
      quad('s0', 'p1', 'o1'),
      quad('s0', 'p1', 'o2'),
    ]);
  });

  it('should return the correct stream for s0 ? ? DM 0-1 (-)', async() => {
    expect(await arrayifyStream(new OstrichIterator(ostrichDocument,
      dm01D,
      DF.namedNode('s0'),
      DF.variable('p'),
      DF.variable('o'),
      {}))).toEqual([
      quad('s0', 'p1', 'o1'),
      quad('s0', 'p1', 'o2'),
    ]);
  });

  it('should return the correct stream for s1 ? ? DM 0-1 (-)', async() => {
    expect(await arrayifyStream(new OstrichIterator(ostrichDocument,
      dm01D,
      DF.namedNode('s1'),
      DF.variable('p'),
      DF.variable('o'),
      {}))).toEqual([]);
  });

  it('should return the correct stream for ? ? ? DM 2-3 (-)', async() => {
    expect(await arrayifyStream(new OstrichIterator(ostrichDocument,
      dm23D,
      DF.variable('s'),
      DF.variable('p'),
      DF.variable('o'),
      {}))).toEqual([]);
  });

  it('should return the correct stream for s0 VQ', async() => {
    expect(await arrayifyStream(new OstrichIterator(ostrichDocument,
      vq,
      DF.namedNode('s0'),
      DF.variable('p'),
      DF.variable('o'),
      {}))).toEqual([
      quad('s0', 'p1', 'o1'),
      quad('s0', 'p1', 'o2'),
    ]);
  });

  it('should not return anything when the document is closed', async() => {
    ostrichDocument.close();
    expect(await arrayifyStream(new OstrichIterator(ostrichDocument,
      vq,
      DF.variable('s'),
      DF.variable('p'),
      DF.variable('o'),
      {}))).toEqual([]);
  });

  it('should resolve to an error if the document emits an error in VM', async() => {
    const e = new Error();
    ostrichDocument.setError(e);
    await expect(arrayifyStream(new OstrichIterator(ostrichDocument,
      vm0,
      DF.variable('s'),
      DF.variable('p'),
      DF.variable('o'),
      {}))).rejects.toBe(e);
  });

  it('should resolve to an error if the document emits an error in DM', async() => {
    const e = new Error();
    ostrichDocument.setError(e);
    await expect(arrayifyStream(new OstrichIterator(ostrichDocument,
      dm01A,
      DF.variable('s'),
      DF.variable('p'),
      DF.variable('o'),
      {}))).rejects.toBe(e);
  });

  it('should resolve to an error if the document emits an error in VQ', async() => {
    const e = new Error();
    ostrichDocument.setError(e);
    await expect(arrayifyStream(new OstrichIterator(ostrichDocument,
      vq,
      DF.variable('s'),
      DF.variable('p'),
      DF.variable('o'),
      {}))).rejects.toBe(e);
  });

  it('should only call query once', async() => {
    const iterator = new OstrichIterator(ostrichDocument,
      vm0,
      DF.variable('s'),
      DF.variable('p'),
      DF.variable('o'),
      {});
    const spy = jest.spyOn(ostrichDocument, 'searchTriplesVersionMaterialized');
    iterator._read(1, () => {
      // Do nothing
    });
    iterator._read(1, () => {
      // Do nothing
    });
    expect(spy).toHaveBeenCalledTimes(1);
  });
});

function t(subject, predicate, object) {
  return { subject, predicate, object };
}
