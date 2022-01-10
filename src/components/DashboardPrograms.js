import React, { useState } from 'react'
import { makeStyles, useTheme } from '@material-ui/core/styles'
import { Container, Paper, TextField } from '@material-ui/core'
import clsx from 'clsx'

import CourseTable from './CourseTable'
import ProgramGraph from './programGraph/ProgramGraph'
import { gql, useQuery } from '@apollo/client'
import {
  ProgramCoursesContext,
  SelectedCoursesContext,
  SelectedProgramContext,
} from '../contexts'
import { Autocomplete } from '@mui/material'

import { SigmaContainer } from 'react-sigma-v2'
import getNodeImageProgram from 'sigma/rendering/webgl/programs/node.image'
import { drawLabelForProgramGraph } from './sigmaGraph/canvas-utils'

const QUERY_GET_PROGRAMS = gql`
  {
    programs {
      id
      name
    }
  }
`

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
  },
  paper: {
    padding: theme.spacing(2),
    display: 'flex',
    overflow: 'auto',
    flexDirection: 'column',
  },
}))

const getUniquePrograms = (programs) => {
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

export default function DashboardPrograms() {
  const [programId, setProgramId] = useState('')
  const [selectedCourses, setSelectedCourses] = useState([])
  const [programCourses, setProgramCourses] = useState([])
  const theme = useTheme()
  const fixedHeightPaper = clsx(useStyles(theme).paper)

  const { loading, error, data } = useQuery(QUERY_GET_PROGRAMS)
  if (error) return <p>Error</p>
  if (loading) return <p>Loading</p>

  const programs = getUniquePrograms(data.programs)
  const selectedProgram = programs.filter((p) => p.id === programId)

  const updateContext = (e) => {
    const selectedProgram = e.target.textContent
      ? e.target.textContent
      : e.target.value
    const [selectedProgramName, selectedProgramId] =
      selectedProgram.split(' - ')

    if (selectedProgramId && selectedProgramId !== '') {
      // update selected program context
      setProgramId(selectedProgramId)
      // when new program is selected, clear selected classes
      setSelectedCourses([])
    }
  }

  console.log(selectedProgram)
  const label =
    selectedProgram && selectedProgram.length > 0
      ? `${selectedProgram[0].name} - ${selectedProgram[0].id}`
      : 'Program'
  return (
    <React.Fragment>
      <SelectedProgramContext.Provider value={{ programId, setProgramId }}>
        <SelectedCoursesContext.Provider
          value={{ selectedCourses, setSelectedCourses }}
        >
          <ProgramCoursesContext.Provider
            value={{ programCourses, setProgramCourses }}
          >
            <Container>
              <Paper className={fixedHeightPaper}>
                <Autocomplete
                  disablePortal
                  options={programs}
                  getOptionLabel={(option) => `${option.name} - ${option.id}`}
                  sx={{ width: 400 }}
                  renderInput={(params) => {
                    return (
                      <TextField
                        {...params}
                        label={
                          selectedProgram && selectedProgram.length > 0
                            ? `${selectedProgram[0].name} - ${programId}`
                            : 'Program'
                        }
                      />
                    )
                  }}
                  onChange={updateContext}
                  onClose={updateContext}
                />
                <SigmaContainer
                  graphOptions={{ type: 'directed', multi: true }}
                  style={{ height: '600px', width: '100%' }}
                  initialSettings={{
                    nodeProgramClasses: { image: getNodeImageProgram() },
                    labelRenderer: drawLabelForProgramGraph,
                    defaultNodeType: 'image',
                    defaultEdgeType: 'arrow',
                    labelDensity: 0.07,
                    labelGridCellSize: 60,
                    labelRenderedSizeThreshold: 11,
                    labelFont: 'Lato, sans-serif',
                    zIndex: true,
                  }}
                  className="react-sigma"
                >
                  <ProgramGraph />
                </SigmaContainer>
                <CourseTable />
              </Paper>
            </Container>
          </ProgramCoursesContext.Provider>
        </SelectedCoursesContext.Provider>
      </SelectedProgramContext.Provider>
    </React.Fragment>
  )
}
