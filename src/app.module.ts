import {MiddlewareConsumer, Module, NestModule} from '@nestjs/common'
import {AuthModule} from './auth/auth.module'
import {UserModule} from './user/user.module'
import {PrismaModule} from './prisma/prisma.module'
import {ConfigModule} from '@nestjs/config'
import {APP_GUARD} from '@nestjs/core'
import {FingerprintMiddleware} from './global/middlewares'
import {AtGuard, FpGuard} from './auth/guard'
import {CardsModule} from './cards/cards.module';
import {ModulesModule} from './modules/modules.module';
import {LearnSessionsModule} from './learn-sessions/learn-sessions.module';
import {CurrentLearnSessionModule} from './current-learn-session/current-learn-session.module';

@Module({
    imports: [
        AuthModule,
        UserModule,
        PrismaModule,
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        CardsModule,
        ModulesModule,
        LearnSessionsModule,
        CurrentLearnSessionModule,
    ],
    providers: [
        {provide: APP_GUARD, useClass: AtGuard},
        {provide: APP_GUARD, useClass: FpGuard},
    ],
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer): any {
        consumer.apply(FingerprintMiddleware).forRoutes('*')
    }
}
