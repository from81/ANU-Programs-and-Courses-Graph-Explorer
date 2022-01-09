import chroma from 'chroma-js'
import { gql } from '@apollo/client'

export const NEO4J_URI = process.env.REACT_APP_NEO4J_URI || 'localhost:7687'
export const NEO4J_USER = process.env.REACT_APP_NEO4J_USER || 'neo4j'
export const NEO4J_PASSWORD = process.env.REACT_APP_NEO4J_PASSWORD || 'neo4j'

export const QUERY_GET_PROGRAMS = gql`
  {
    programs {
      id
      name
    }
  }
`

export const getUniqueClassesSorted = (classes) => {
  let obj = {}
  classes
    .filter((cls) => cls.id && cls.id !== '')
    .filter((cls) => cls.name && cls.name.trim() !== '')
    .forEach((cls) => {
      obj[cls.id] = cls
    })
  return Object.keys(obj)
    .map((id) => obj[id])
    .sort((a, b) => a.id.localeCompare(b.id))
}

export const getUniquePrograms = (programs) => {
  let obj = {}
  programs
    .filter((program) => program.id && program.id !== '')
    .filter((program) => program.name && program.name.trim() !== '')
    .forEach((program) => {
      obj[program.id] = program
    })
  return Object.keys(obj).map(function (id) {
    return obj[id]
  })
}

export const extractLink = (segment) => {
  return {
    from: segment.start.properties.id,
    to: segment.end.properties.id,
    label: segment.relationship.type,
  }
}

export const getTags = (nodes) => {
  function onlyUnique(value, index, self) {
    return self.indexOf(value) === index
  }
  const tags = nodes.map((n) => n.tag).filter(onlyUnique)
  const colors = chroma.scale('Spectral').colors(10)
  let ret = new Array(tags.length)
  for (let i = 0; i < tags.length; i++) {
    ret[i] = {
      key: tags[i],
      color: colors[i % 10],
    }
  }
  return ret
}

export const extractDataset = (records, extractNode) => {
  let nodesMap = {}
  const edges = records.flatMap((item) =>
    item.get('p').segments.map((segment) => {
      const edge = extractLink(segment)
      nodesMap[segment.start] = extractNode(segment.start)
      nodesMap[segment.end] = extractNode(segment.end)
      return edge
    })
  )
  const nodes = Object.keys(nodesMap).map((id) => nodesMap[id])
  for (const subject in nodes) {
    if (nodes[subject].units) {
      nodes[subject].units = nodes[subject].units.low
    }
  }
  const tags = getTags(nodes)
  return {
    nodes: nodes,
    edges: edges,
    tags: tags,
  }
}
