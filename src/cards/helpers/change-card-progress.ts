import {CardLearnProgressEntity} from "../entities/card-progress.entity";
import {LEARN_STATUS} from "@prisma/client";
import * as moment from "moment";

const getAccuracy = (cardProgress: CardLearnProgressEntity, answer: boolean) => {
    if (answer) {
        return Math.round((cardProgress.countOfRightAnswers + 1) / (cardProgress.countOfAnswers + 1) * 100)
    } else {
        return Math.round(cardProgress.countOfRightAnswers / (cardProgress.countOfAnswers + 1) * 100)
    }
}

const getNextIntervalDate = (interval: number) => {
    switch (interval) {
        case 0: {
            return moment().utc().add(2, 'm').toDate()
        }
        case 1: {
            return moment().utc().add(5, 'm').toDate()
        }
        case 2: {
            return moment().utc().add(1, 'day').startOf('day').toDate()
        }
        case 3: {
            return moment().utc().add(2, 'day').startOf('day').toDate()
        }
        case 4: {
            return moment().utc().add(3, 'day').startOf('day').toDate()
        }
        case 5: {
            return moment().utc().add(6, 'day').startOf('day').toDate()
        }
        case 6: {
            return moment().utc().add(11, 'day').startOf('day').toDate()
        }
        case 7: {
            return moment().utc().add(21, 'day').startOf('day').toDate()
        }
        case 8: {
            return moment().utc().add(40, 'day').startOf('day').toDate()
        }
        default: {
            return moment().utc().add(40, 'day').startOf('day').toDate()
        }
    }
}

const isFamiliar = (cardProgress: CardLearnProgressEntity): boolean => {
    const nextInterval = cardProgress.interval + 1
    const nextAccuracy = getAccuracy(cardProgress, true)
    return (nextAccuracy >= 80 && nextInterval >= 4) || (nextInterval >= 6)
}




export const changeCardProgressPositive = (cardProgress: CardLearnProgressEntity): Partial<CardLearnProgressEntity> => {
    switch (cardProgress.status) {
        case LEARN_STATUS.NEW: {
            return {
                status: LEARN_STATUS.SHOWN,
                interval: 0,
                accuracy: 100,
                countOfRightAnswers: 1,
                countOfAnswers: 1,
                lastRepetitionDate: moment().toDate(),
                nextRepetitionDate: getNextIntervalDate(0)
            }
        }
        case LEARN_STATUS.SHOWN: {
            return {
                status: LEARN_STATUS.IN_PROGRESS,
                interval: cardProgress.interval + 1,
                accuracy: getAccuracy(cardProgress, true),
                countOfRightAnswers: cardProgress.countOfRightAnswers + 1,
                countOfAnswers: cardProgress.countOfAnswers + 1,
                lastRepetitionDate: moment().toDate(),
                nextRepetitionDate: getNextIntervalDate(cardProgress.interval + 1)
            }
        }
        case LEARN_STATUS.IN_PROGRESS: {
            return {
                status: isFamiliar(cardProgress) ? LEARN_STATUS.FAMILIAR : LEARN_STATUS.IN_PROGRESS,
                interval: cardProgress.interval + 1,
                accuracy: getAccuracy(cardProgress, true),
                countOfRightAnswers: cardProgress.countOfRightAnswers + 1,
                countOfAnswers: cardProgress.countOfAnswers + 1,
                lastRepetitionDate: moment().toDate(),
                nextRepetitionDate: getNextIntervalDate(cardProgress.interval + 1)
            }
        }
        case LEARN_STATUS.FAMILIAR: {
            return {
                status: LEARN_STATUS.KNOWN,
                interval: cardProgress.interval + 1,
                accuracy: getAccuracy(cardProgress, true),
                countOfRightAnswers: cardProgress.countOfRightAnswers + 1,
                countOfAnswers: cardProgress.countOfAnswers + 1,
                lastRepetitionDate: moment().toDate(),
                nextRepetitionDate: getNextIntervalDate(cardProgress.interval + 1)
            }
        }
    }
}


export const changeCardProgressNegative = (cardProgress: CardLearnProgressEntity) => {
    switch (cardProgress.status) {
        case LEARN_STATUS.NEW: {
            //Регистрируем как правильный ответ
            return {
                status: LEARN_STATUS.SHOWN,
                interval: 0,
                accuracy: 100,
                countOfRightAnswers: 1,
                countOfAnswers: 1,
                lastRepetitionDate: moment().toDate(),
                nextRepetitionDate: getNextIntervalDate(0)
            }
        }
        case LEARN_STATUS.SHOWN: {
            return {
                status: LEARN_STATUS.SHOWN,
                interval: 0,
                accuracy: getAccuracy(cardProgress, false),
                countOfRightAnswers: cardProgress.countOfRightAnswers,
                countOfAnswers: cardProgress.countOfAnswers + 1,
                lastRepetitionDate: moment().toDate(),
                nextRepetitionDate: getNextIntervalDate(0)
            }
        }
        case LEARN_STATUS.IN_PROGRESS: {
            return {
                status: LEARN_STATUS.IN_PROGRESS,
                interval: 0,
                accuracy: getAccuracy(cardProgress, false),
                countOfRightAnswers: cardProgress.countOfRightAnswers,
                countOfAnswers: cardProgress.countOfAnswers + 1,
                lastRepetitionDate: moment().toDate(),
                nextRepetitionDate: getNextIntervalDate(0)
            }
        }
        case LEARN_STATUS.FAMILIAR: {
            return {
                status: LEARN_STATUS.IN_PROGRESS,
                interval: 0,
                accuracy: getAccuracy(cardProgress, false),
                countOfRightAnswers: cardProgress.countOfRightAnswers,
                countOfAnswers: cardProgress.countOfAnswers + 1,
                lastRepetitionDate: moment().toDate(),
                nextRepetitionDate: getNextIntervalDate(0)
            }
        }
    }
}

