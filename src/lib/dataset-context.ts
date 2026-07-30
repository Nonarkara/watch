import { createContext, useContext } from 'react'
import type { Dataset } from './data.ts'

export const DataContext = createContext<Dataset | null>(null)
export const useDataset = () => useContext(DataContext)
