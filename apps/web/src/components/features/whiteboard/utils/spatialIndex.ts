/**
 * Spatial Indexing System for Viewport Culling
 *
 * Uses a simple grid-based spatial index for fast element lookup.
 * For production with 10,000+ elements, consider implementing R-tree.
 */

export interface Bounds {
  x: number
  y: number
  width: number
  height: number
}

export interface Element {
  id: string
  position: { x: number; y: number }
  size: { width: number; height: number }
  [key: string]: any
}

/**
 * Grid-based spatial index for fast viewport queries
 * Divides canvas into cells for O(1) lookup of visible elements
 */
export class SpatialIndex<T extends Element> {
  private cellSize: number
  private grid: Map<string, Set<T>>
  private elementCells: Map<string, Set<string>>

  constructor(cellSize: number = 500) {
    this.cellSize = cellSize
    this.grid = new Map()
    this.elementCells = new Map()
  }

  /**
   * Get grid cell key from coordinates
   */
  private getCellKey(x: number, y: number): string {
    const cellX = Math.floor(x / this.cellSize)
    const cellY = Math.floor(y / this.cellSize)
    return `${cellX},${cellY}`
  }

  /**
   * Get all cells that an element overlaps
   */
  private getElementCells(element: T): string[] {
    const { position, size } = element
    const minX = position.x
    const minY = position.y
    const maxX = position.x + size.width
    const maxY = position.y + size.height

    const cells: string[] = []
    const startCellX = Math.floor(minX / this.cellSize)
    const startCellY = Math.floor(minY / this.cellSize)
    const endCellX = Math.floor(maxX / this.cellSize)
    const endCellY = Math.floor(maxY / this.cellSize)

    for (let x = startCellX; x <= endCellX; x++) {
      for (let y = startCellY; y <= endCellY; y++) {
        cells.push(`${x},${y}`)
      }
    }

    return cells
  }

  /**
   * Insert element into spatial index
   */
  insert(element: T): void {
    const cells = this.getElementCells(element)
    this.elementCells.set(element.id, new Set(cells))

    for (const cellKey of cells) {
      if (!this.grid.has(cellKey)) {
        this.grid.set(cellKey, new Set())
      }
      this.grid.get(cellKey)!.add(element)
    }
  }

  /**
   * Remove element from spatial index
   */
  remove(elementId: string): void {
    const cells = this.elementCells.get(elementId)
    if (!cells) return

    for (const cellKey of cells) {
      const cell = this.grid.get(cellKey)
      if (cell) {
        for (const element of cell) {
          if (element.id === elementId) {
            cell.delete(element)
            break
          }
        }
        if (cell.size === 0) {
          this.grid.delete(cellKey)
        }
      }
    }

    this.elementCells.delete(elementId)
  }

  /**
   * Update element position in spatial index
   */
  update(element: T): void {
    this.remove(element.id)
    this.insert(element)
  }

  /**
   * Query elements within viewport bounds with buffer
   */
  query(bounds: Bounds, buffer: number = 200): T[] {
    const minX = bounds.x - buffer
    const minY = bounds.y - buffer
    const maxX = bounds.x + bounds.width + buffer
    const maxY = bounds.y + bounds.height + buffer

    const startCellX = Math.floor(minX / this.cellSize)
    const startCellY = Math.floor(minY / this.cellSize)
    const endCellX = Math.floor(maxX / this.cellSize)
    const endCellY = Math.floor(maxY / this.cellSize)

    const results = new Map<string, T>()

    for (let x = startCellX; x <= endCellX; x++) {
      for (let y = startCellY; y <= endCellY; y++) {
        const cellKey = `${x},${y}`
        const cell = this.grid.get(cellKey)
        if (cell) {
          for (const element of cell) {
            // Precise bounds check
            if (this.intersects(element, { x: minX, y: minY, width: maxX - minX, height: maxY - minY })) {
              results.set(element.id, element)
            }
          }
        }
      }
    }

    return Array.from(results.values())
  }

  /**
   * Check if element intersects with bounds
   */
  private intersects(element: T, bounds: Bounds): boolean {
    const elemRight = element.position.x + element.size.width
    const elemBottom = element.position.y + element.size.height
    const boundsRight = bounds.x + bounds.width
    const boundsBottom = bounds.y + bounds.height

    return !(
      elemRight < bounds.x ||
      element.position.x > boundsRight ||
      elemBottom < bounds.y ||
      element.position.y > boundsBottom
    )
  }

  /**
   * Clear entire spatial index
   */
  clear(): void {
    this.grid.clear()
    this.elementCells.clear()
  }

  /**
   * Rebuild entire spatial index from elements array
   */
  rebuild(elements: T[]): void {
    this.clear()
    for (const element of elements) {
      this.insert(element)
    }
  }

  /**
   * Get statistics about the spatial index
   */
  getStats(): {
    totalCells: number
    totalElements: number
    averageElementsPerCell: number
  } {
    let totalElements = 0
    for (const cell of this.grid.values()) {
      totalElements += cell.size
    }

    return {
      totalCells: this.grid.size,
      totalElements: this.elementCells.size,
      averageElementsPerCell: this.grid.size > 0 ? totalElements / this.grid.size : 0,
    }
  }
}

/**
 * Calculate viewport bounds from canvas state
 */
export function getViewportBounds(
  canvasWidth: number,
  canvasHeight: number,
  zoom: number,
  pan: { x: number; y: number }
): Bounds {
  const scale = zoom / 100
  return {
    x: -pan.x / scale,
    y: -pan.y / scale,
    width: canvasWidth / scale,
    height: canvasHeight / scale,
  }
}
