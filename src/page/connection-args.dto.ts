import { ApiProperty } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsNumber, IsOptional } from 'class-validator'

export class ConnectionArgs {
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @ApiProperty({ required: false })
  first?: number

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @ApiProperty({ required: false })
  last?: number

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @ApiProperty({ required: false })
  after?

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @ApiProperty({ required: false })
  before?
}
