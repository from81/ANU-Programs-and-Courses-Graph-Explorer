import React, { useState } from 'react'
import { makeStyles, useTheme } from '@material-ui/core/styles'
import { Container, Paper, TextField } from '@material-ui/core'
import clsx from 'clsx'

import CourseTable from './CourseTable'
import ProgramGraph from './ProgramGraph'
import { gql, useQuery } from '@apollo/client'
import { Autocomplete } from '@mui/material'
import { useDispatch, useSelector } from 'react-redux'
import { clearCourse, setProgram } from '../selections'

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
  const programId = useSelector((state) =>
    state.selections.programId ? state.selections.programId : ''
  )
  const dispatch = useDispatch()
  const [clearSelected, setClearSelected] = useState(false)
  const theme = useTheme()
  const fixedHeightPaper = clsx(useStyles(theme).paper)

  const { loading, error, data } = useQuery(QUERY_GET_PROGRAMS)
  if (error) return <p>Error</p>
  if (loading) return null

  const programs = getUniquePrograms(data.programs)
  const selectedProgram = programs.filter((p) => p.id === programId)

  const updateContext = (e) => {
    const selectedProgram = e.target.textContent
      ? e.target.textContent
      : e.target.value
    const [selectedProgramName, selectedProgramId] =
      selectedProgram.split(' - ')

    if (selectedProgramId && selectedProgramId !== '') {
      dispatch(setProgram(selectedProgramId))
      dispatch(clearCourse())
      setClearSelected(true)
    }
  }

  return (
    <React.Fragment>
      <Container>
        <Paper className={fixedHeightPaper}>
          <Autocomplete
            disablePortal
            options={programs}
            getOptionLabel={(option) => `${option.name} - ${option.id}`}
            sx={{ width: 400 }}
            renderInput={(params) => {
              return <TextField {...params} label="Program" />
            }}
            onChange={updateContext}
            onClose={updateContext}
          />
          <ProgramGraph />
          <CourseTable clearSelected={clearSelected} />
        </Paper>
      </Container>
    </React.Fragment>
  )
}
