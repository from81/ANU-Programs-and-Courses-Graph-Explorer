import React, { useEffect, useRef, useState } from 'react'
import '../graph.css'
import DataController from './DataController'
import {
  extractDataset,
  NEO4J_PASSWORD,
  NEO4J_URI,
  NEO4J_USER,
} from '../../utils'
import GraphSettingsController from '../sigmaGraph/views/GraphSettingsController'
import EventsController from './EventsController'
import { drawHoverForProgram } from '../sigmaGraph/canvas-utils'
import { useSelector } from 'react-redux'
import PropTypes from 'prop-types'
import CytoscapeComponent from 'react-cytoscapejs/src/component'
import { CircularProgress } from '@material-ui/core'
import cytoscape from 'cytoscape'
import dagre from 'cytoscape-dagre'
import elk from 'cytoscape-elk'
import cola from 'cytoscape-cola'
import avsdf from 'cytoscape-avsdf'
import cise from 'cytoscape-cise'
import coseBilkent from 'cytoscape-cose-bilkent'
import fcose from 'cytoscape-fcose'
cytoscape.use(dagre)
// cytoscape.use(elk)
// cytoscape.use(cola)
// cytoscape.use(avsdf)
// cytoscape.use(cise)
// cytoscape.use(coseBilkent)
// cytoscape.use(fcose)

const neo4j = require('neo4j-driver')
const driver = neo4j.driver(
  NEO4J_URI,
  neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD)
)

const CYPHER_QUERY =
  'MATCH p=(:Program {id: $program_id})-[r:REQUIREMENT*1..]->() RETURN p'

export default function ProgramGraph(props) {
  const { children } = props
  const programId = useSelector((state) =>
    state.selections.programId ? state.selections.programId : ''
  )
  const [dataset, setDataset] = useState({
    nodes: [],
    edges: [],
    tags: [],
  })
  const [cytoscapeDataset, setCytoscapeDataset] = useState([])
  const [style, setStyle] = useState([])
  const extractNode = (node) => {
    let extracted = {
      ...node.properties,
      tag: node.labels[0],
    }

    if (extracted.tag === 'Requirement' && node.properties.units) {
      extracted.label = node.properties.units.low
    } else if (extracted.tag === 'Program') {
      extracted.label = node.properties.name
    } else if (extracted.tag === 'Specialisation') {
      extracted.label = node.properties.name
    } else if (extracted.tag === 'Course') {
      extracted.label = `${node.properties.id} ${node.properties.name}`
    }
    return extracted
  }
  const [layout, setLayout] = useState({
    name: 'breadthfirst',

    fit: true, // whether to fit the viewport to the graph
    directed: true, // whether the tree is directed downwards (or edges can point in any direction if false)
    padding: 30, // padding on fit
    circle: false, // put depths in concentric circles if true, put depths top down if false
    grid: true, // whether to create an even grid into which the DAG is placed (circle:false only)
    spacingFactor: 1.75, // positive spacing factor, larger => more space between nodes (N.B. n/a if causes overlap)
    boundingBox: undefined, // constrain layout bounds; { x1, y1, x2, y2 } or { x1, y1, w, h }
    avoidOverlap: true, // prevents node overlap, may overflow boundingBox if not enough space
    nodeDimensionsIncludeLabels: false, // Excludes the label when calculating node bounding boxes for the layout algorithm
    roots: undefined, // the roots of the trees
    maximal: true, // whether to shift nodes down their natural BFS depths in order to avoid upwards edges (DAGS only)
    animate: false, // whether to transition the node positions
    animationDuration: 500, // duration of animation in ms if enabled
    animationEasing: undefined, // easing of animation if enabled,
    animateFilter: function (node, i) {
      return true
    }, // a function that determines whether the node should be animated.  All nodes animated by default on animate enabled.  Non-animated nodes are positioned immediately when the layout starts
    ready: undefined, // callback on layoutready
    stop: undefined, // callback on layoutstop
    transform: function (node, position) {
      return position
    },
  })

  useEffect(() => {
    if (programId !== '') {
      const session = driver.session({ defaultAccessMode: neo4j.session.READ })
      session
        .run(CYPHER_QUERY, { program_id: programId })
        .then((result) => {
          const dataset = extractDataset(result.records, extractNode)
          setDataset(dataset)
        })
        .catch((error) => {
          console.log(error)
        })
        .then(() => session.close())
    }
  }, [programId])

  useEffect(() => {
    console.log(dataset)
    const { nodes, edges, tags } = dataset
    let newDataset = []

    // TODO: use stylesheet instead of using style parameter to style nodes
    // TODO: use selector
    if (nodes) {
      try {
        nodes.forEach((node) => {
          let data = { ...node }
          if (!data.label && data.description) {
            data.label = data.description
          }
          newDataset.push({
            data: data,
            classes: [node.tag],
            // style: {'background-color': node.color},
          })
        })
        console.log(nodes[0].key)
        // setLayout({ ...layout, roots: [nodes[0].key] })
      } catch (e) {
        // console.log(e)
      }
    }
    if (edges) {
      edges.forEach((edge) => {
        newDataset.push({
          data: {
            source: edge.from,
            target: edge.to,
            label: edge.label,
          },
        })
      })
    }

    console.log(newDataset)
    setCytoscapeDataset(newDataset)
  }, [dataset])

  useEffect(() => {
    console.log(cytoscapeDataset)

    const style = [
      // // the stylesheet for the graph
      // {
      //   selector: 'node',
      //   style: {
      //     'background-color': '#FF5454',
      //     label: 'data(label)',
      //     'font-family': 'Helvetica',
      //     'font-size': 8,
      //     'min-zoomed-font-size': 8,
      //   },
      // },
      //
      // {
      //   selector: 'edge',
      //   style: {
      //     width: 3,
      //     'line-color': '#ccc',
      //     'target-arrow-color': '#ccc',
      //     // 'curve-style': 'bezier',
      //     'target-arrow-shape': 'triangle',
      //   },
      // },

      {
        selector: 'node',
        style: {
          label: 'data(label)',
          width: 100,
          height: 100,
          shape: 'ellipse',
          'background-color': '#FF5454',
          'font-family': 'Helvetica',
          'font-size': 30,
          'min-zoomed-font-size': 30,
        },
      },
      {
        selector: 'edge',
        style: {
          width: 5,
          // 'curve-style': 'bezier',
          'target-arrow-shape': 'triangle',
          'line-color': '#999',
          'overlay-opacity': 0,
          'target-arrow-color': '#999',
        },
      },
    ]
    setStyle(style)
  }, [cytoscapeDataset])

  useEffect(() => {
    let cy = cytoscape({
      container: document.getElementById('cy'), // container to render in
      elements: cytoscapeDataset,
      style: style,
      layout: layout,
    })
  }, [style])
  if (!(cytoscapeDataset && style && layout)) return <CircularProgress />

  return (
    <>
      <CytoscapeComponent
        elements={cytoscapeDataset}
        stylesheet={style}
        layout={layout}
        style={{ width: '100%', height: '50vh' }}
      />
      <div id={'cy'} style={{ width: '100%', height: '50vh' }} />
    </>
  )
}
