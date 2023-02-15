import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { AuthModule } from './auth/auth.module'
import { UserModule } from './user/user.module'
import { PrismaModule } from './prisma/prisma.module'
import { ConfigModule } from '@nestjs/config'
import { APP_GUARD } from '@nestjs/core'
import { FingerprintMiddleware } from './global/middlewares'
import { AtGuard, FpGuard } from './auth/guard'

@Module({
  imports: [
    AuthModule,
    UserModule,
    PrismaModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  providers: [
    { provide: APP_GUARD, useClass: AtGuard },
    { provide: APP_GUARD, useClass: FpGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): any {
    consumer.apply(FingerprintMiddleware).forRoutes('*')
  }
}
