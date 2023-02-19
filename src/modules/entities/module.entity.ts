import { ApiProperty } from "@nestjs/swagger";
import { Module } from "@prisma/client";

export class ModuleEntity implements Module {

    @ApiProperty() id: string
    @ApiProperty() createdAt: Date
    @ApiProperty() updatedAt: Date
    @ApiProperty() label: string
    @ApiProperty()  userId: string
    @ApiProperty({ required: false, nullable: true }) folderId: string | null
    @ApiProperty() _count: {
        cards: number
    }
    constructor(partial: Partial<ModuleEntity>) {
        Object.assign(this, partial)
    }
}

