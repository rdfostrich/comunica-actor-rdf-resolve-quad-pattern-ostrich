# Comunica OSTRICH RDF Resolve Quad Pattern Actor

[![npm version](https://badge.fury.io/js/%40comunica%2Factor-rdf-resolve-quad-pattern-ostrich.svg)](https://www.npmjs.com/package/@comunica/actor-rdf-resolve-quad-pattern-ostrich)
[![Build Status](https://travis-ci.org/rdfostrich/comunica-actor-rdf-resolve-quad-pattern-ostrich.svg?branch=master)](https://travis-ci.org/rdfostrich/comunica-actor-rdf-resolve-quad-pattern-ostrich)
[![Coverage Status](https://coveralls.io/repos/github/rdfostrich/comunica-actor-rdf-resolve-quad-pattern-ostrich/badge.svg?branch=master)](https://coveralls.io/github/rdfostrich/comunica-actor-rdf-resolve-quad-pattern-ostrich?branch=master)

An [RDF Resolve Quad Pattern](https://github.com/comunica/comunica/tree/master/packages/bus-rdf-resolve-quad-pattern) actor that handles [OSTRICH files](https://github.com/rdfostrich).

This module is part of the [Comunica framework](https://github.com/comunica/comunica),
and should only be used by [developers that want to build their own query engine](https://comunica.dev/docs/modify/).

[Click here if you just want to query with Comunica](https://comunica.dev/docs/query/getting_started/).

## Install

OSTRICH requires ZLib, Kyoto Cabinet and CMake (compilation only) to be installed.

```bash
$ yarn add @comunica/actor-rdf-resolve-quad-pattern-ostrich
```

## Configure

After installing, this package can be added to your engine's configuration as follows:
```text
{
  "@context": [
    ...
    "https://linkedsoftwaredependencies.org/bundles/npm/@comunica/actor-rdf-resolve-quad-pattern-ostrich/^1.0.0/components/context.jsonld"  
  ],
  "actors": [
    ...
    {
      "@id": "config-sets:resolve-rdfjs.json#myOstrichQuadPatternResolver",
      "@type": "ActorRdfResolveQuadPatternOstrich"
    }
  ]
}
```
