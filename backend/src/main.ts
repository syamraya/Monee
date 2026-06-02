import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import * as dotenv from "dotenv";
import { AppModule } from "./app.module";

dotenv.config();

async function bootstrap() {
  // Paksa IPv4 agar koneksi SMTP Gmail tidak timeout
  const { setDefaultResultOrder } = require('dns');
  setDefaultResultOrder('ipv4first');

  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: [
      "http://localhost:3000", 
      "https://fintrack-new-pi.vercel.app",
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

  await app.listen(3001);
}

bootstrap();