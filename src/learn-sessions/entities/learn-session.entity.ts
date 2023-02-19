import {ApiProperty} from "@nestjs/swagger";
import {LearnSession} from "@prisma/client";

export class LearnSessionEntity implements LearnSession {

    @ApiProperty() id: string
    @ApiProperty() createdAt: Date
    @ApiProperty() completed: boolean
    @ApiProperty() userId: string
    @ApiProperty() user: {
        learnGoal: number
    }

    constructor(partial: Partial<LearnSessionEntity>) {
        Object.assign(this, partial)
    }
}

