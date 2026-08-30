import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import IterationTree from './IterationTree'

describe('IterationTree', () => {
  it('shows branches and restores a selected iteration', () => {
    const onSelect = vi.fn()
    render(
      <IterationTree
        selectedId={3}
        onSelect={onSelect}
        iterations={[
          { id: 1, parentId: null, prompt: 'Dos botones', status: 'completed', suggestion: 'Listo.' },
          { id: 2, parentId: 1, prompt: 'En columna', status: 'completed', suggestion: 'Actualizado.' },
          { id: 3, parentId: 1, prompt: 'En fila', status: 'completed', suggestion: 'Alternativa.' },
        ]}
      />,
    )

    expect(screen.getByText('Iteration tree')).toBeInTheDocument()
    expect(screen.getAllByRole('treeitem')).toHaveLength(4)
    expect(screen.getByRole('treeitem', { name: /En fila/ })).toHaveAttribute('aria-selected', 'true')

    fireEvent.click(screen.getByRole('treeitem', { name: /En columna/ }))
    expect(onSelect).toHaveBeenCalledWith(2)
  })
})
