import {findManyCursorConnection} from '@devoxa/prisma-relay-cursor-connection';
import {ForbiddenException, Injectable, NotFoundException} from '@nestjs/common';
import {LEARN_STATUS, Prisma} from '@prisma/client';
import {ConnectionArgs} from 'src/page/connection-args.dto';
import {Page} from 'src/page/page.dto';
import {PrismaService} from 'src/prisma/prisma.service';
import {CreateCardDto} from './dto/create-card.dto';
import {UpdateCardDto} from './dto/update-card.dto';
import {CardEntity} from "./entities/card.entity";
import {CurrentLearnSessionService} from "../current-learn-session/current-learn-session.service";
import {changeCardProgressNegative, changeCardProgressPositive, getNextLearnCard} from './helpers';

@Injectable()
export class CardsService {
    entityName = 'Card'

    constructor(private prisma: PrismaService, private readonly currentLearnSessionService: CurrentLearnSessionService) {
    }

    async create(createCardDto: CreateCardDto, userId: string): Promise<CardEntity> {
        const module = await this.prisma.module.findFirst({
            where: {
                id: createCardDto.moduleId
            },
        })
        if (!module) {
            throw new NotFoundException(`Module is not found`)
        }
        const card = await this.prisma.card.create({
            data: {
                phraseTranslation: createCardDto.phraseTranslation,
                sentenceTranslation: createCardDto.sentenceTranslation,
                notes: createCardDto.notes,
                userId,
                moduleId: createCardDto.moduleId,
                sentence: {
                    create: createCardDto.sentence
                },
            },
            include: {
                sentence: true,
            }
        })

        await this.prisma.cardLearnProgress.create({
            data: {
                cardId: card.id
            }
        })

        return card
    }

    async findAll(userId: string, moduleId: string, connectionArgs: ConnectionArgs, ) {
        const where: Prisma.CardWhereInput = {
            userId,
            moduleId
        }
        const page = await findManyCursorConnection(
            (args: Prisma.CardFindManyArgs) =>
                this.prisma.card.findMany({...args, where, include: {sentence: true, progress: true}, orderBy: [{createdAt: 'desc'}]}),
            () => this.prisma.card.count({where}),
            connectionArgs,
        )
        return new Page<CardEntity>(page)
    }

    async findOne(id: string, userId: string) {
        const card = await this.prisma.card.findFirst({
            where: {
                id,
                userId,
            },
            include: {
                sentence: true
            }
        })
        if (!card) {
            throw new NotFoundException(`${this.entityName} is not found`)
        }
        return card;
    }

    async update(id: string, userId: string, updateCardDto: UpdateCardDto): Promise<CardEntity> {
        const card = await this.findOne(id, userId)
        if (!card) {
            throw new NotFoundException(`${this.entityName} is not found`)
        }
        if (card.userId !== userId) {
            throw new ForbiddenException()
        }
        return this.prisma.card.update({
            where: {
                id,
            },
            data: {
                phraseTranslation: updateCardDto.phraseTranslation,
                sentenceTranslation: updateCardDto.sentenceTranslation,
                notes: updateCardDto.notes,
                moduleId: updateCardDto.moduleId,
                sentence: {
                    deleteMany: {
                        cardId: id
                    },
                    createMany: {data: updateCardDto.sentence}
                }
            },
            include: {
                sentence: true
            }
        })
    }

    async remove(id: string, userId: string): Promise<CardEntity> {
        const card = await this.findOne(id, userId)
        if (!card) {
            throw new NotFoundException(`${this.entityName} is not found`)
        }
        if (card.userId !== userId) {
            throw new ForbiddenException()
        }
        const [,, deletedCard] = await this.prisma.$transaction([
            this.prisma.sentenceUnit.deleteMany({where: {
                cardId: card.id
                }}),
            this.prisma.cardLearnProgress.delete({where: {
                    cardId: card.id
                }}),
            this.prisma.card.delete({where: {
                    id,
                }, include:{
                sentence: true
                }})
        ])
        return deletedCard
    }

    async registerRightAnswer(id: string, userId: string) {
        const progress = await this.prisma.cardLearnProgress.findUnique({
            where: {
                cardId: id
            }
        })
        if (!progress) {
            throw new NotFoundException(`Card progress is not found`)
        }
        if (progress.status === LEARN_STATUS.KNOWN) {
            throw new ForbiddenException(`Known cards unchanged`)
        }

        await this.currentLearnSessionService.incrementCount(userId, true)

        return await this.prisma.cardLearnProgress.update({
            where: {
                cardId: id
            },
            data: changeCardProgressPositive(progress)
        })
    }

    async registerWrongAnswer(id: string, userId: string) {
        const progress = await this.prisma.cardLearnProgress.findUnique({
            where: {
                cardId: id
            }
        })
        if (!progress) {
            throw new NotFoundException(`Card progress is not found`)
        }
        if (progress.status === LEARN_STATUS.KNOWN) {
            throw new ForbiddenException(`Known cards unchanged`)
        }
        //Update current learn session
        await this.currentLearnSessionService.incrementCount(userId, false)
        //Update progress
        return await this.prisma.cardLearnProgress.update({
            where: {
                cardId: id
            },
            data: changeCardProgressNegative(progress)
        })
    }

    async findLearnCard(userId: string): Promise<CardEntity | null> {
        const currentSession = await this.prisma.currentLearnSession.findUnique({
            where: {
                userId
            }
        })
        if (!currentSession) {
            throw new NotFoundException(`${this.entityName} is not found`)
        }
        //If no modules
        const modules = currentSession.modules.map((id) => {
            return {
                moduleId: id
            }
        })
        let cards
        if (modules.length === 0) {
            cards = await this.prisma.card.findMany({
                where: {
                    userId
                },
                include: {
                    progress: true,
                    sentence: true
                }
            })
        } else {
            cards = await this.prisma.card.findMany({
                where: {
                    OR: modules,
                },
                include: {
                    progress: true,
                    sentence: true
                }
            })
        }

        return getNextLearnCard(cards, currentSession.createdAt)
    }

}
