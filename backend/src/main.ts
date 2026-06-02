import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  // Paksa IPv4 agar koneksi SMTP Gmail tidak timeout
  const { setDefaultResultOrder } = require('dns');
  setDefaultResultOrder('ipv4first');

  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: [
      "https://monee-psi.vercel.app", 
      "https://monee-production.up.railway.app",
      "http://localhost:3000",
    ],
    credentials: true,
  });


  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  await app.listen(process.env.PORT ?? 3001);
}

bootstrap();