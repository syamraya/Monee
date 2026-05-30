import { Injectable } from '@nestjs/common';
import {
  createClient,
  SupabaseClient,
} from '@supabase/supabase-js';

@Injectable()
export class FilesService {
  private supabase: SupabaseClient;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY; // Gunakan SERVICE_ROLE_KEY di .env kamu

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase URL atau Key hilang di file .env, bre!');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async uploadPublicFile(file: Express.Multer.File, bucket: string) {
    const fileExt = file.originalname.split('.').pop();
    // Bersihkan nama file dari emoji dan karakter aneh
    const fileName = `avatar-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `profile/${fileName}`;

    const { data, error } = await this.supabase.storage
      .from(bucket)
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: true,
      });

    if (error) throw error;

    const { data: publicUrl } = this.supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return publicUrl.publicUrl;
  }
}
