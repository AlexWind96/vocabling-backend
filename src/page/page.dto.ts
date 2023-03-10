import { ApiProperty } from '@nestjs/swagger'
import { Edge } from './edge.dto'
import { PageInfo } from './page-info.dto'

export class Page<Record> {
  edges: Edge<Record>[]

  @ApiProperty()
  pageInfo: PageInfo

  @ApiProperty()
  totalCount: number

  constructor(partial: Partial<Page<Record>>) {
    this.edges = partial.edges
    this.pageInfo = partial.pageInfo
    this.totalCount = partial.totalCount
  }
}
