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

const getNextDay = (days: number) => {
    return moment().utc().add(days, 'day').startOf('day').toDate()
}

const getNextTime = (min: number) => {
    return moment().utc().add(min, 'm').toDate()
}

const getNextIntervalDate = (interval: number) => {
    switch (interval) {
        case 0: {
            return getNextTime(2)
        }
        case 1: {
            return getNextTime(5)
        }
        case 2: {
            return getNextDay(1)
        }
        case 3: {
            return getNextDay(2)
        }
        case 4: {
            return getNextDay(3)
        }
        case 5: {
            return getNextDay(6)
        }
        case 6: {
            return getNextDay(11)
        }
        case 7: {
            return getNextDay(21)
        }
        case 8: {
            return getNextDay(40)
        }
        default: {
            return getNextDay(40)
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

