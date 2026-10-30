import { NextResponse } from 'next/server';
import { handleUpdateNodeVideo, verifyAdminPin } from '@/lib/gameServer';
import { getSupabaseServerClient } from '@/lib/supabaseClient';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get('content-type') || '';

    // 1. Jos ladataan suoraan MP4-tiedosto selaimesta (multipart/form-data)
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      const nodeKey = String(formData.get('nodeKey') || '').trim().toUpperCase();
      const adminPin = String(formData.get('adminPin') || '').trim();

      if (!file || !nodeKey || !adminPin) {
        return NextResponse.json(
          { success: false, error: 'Tiedosto, nodeKey ja adminPin vaaditaan.' },
          { status: 400 }
        );
      }

      if (!verifyAdminPin(adminPin)) {
        return NextResponse.json(
          { success: false, error: 'Virheellinen Admin PIN-koodi.' },
          { status: 401 }
        );
      }

      const num = nodeKey.replace(/[^0-9]/g, '').padStart(2, '0');
      const fileName = `node${num}.mp4`;
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      let finalVideoUrl = `/videos/${fileName}`;
      let savedLocally = false;

      // Yritetään tallentaa paikalliseen public/videos-kansioon (toimii localhostissa)
      try {
        const videosDir = path.join(process.cwd(), 'public', 'videos');
        await mkdir(videosDir, { recursive: true });
        const targetPath = path.join(videosDir, fileName);
        await writeFile(targetPath, buffer);
        savedLocally = true;
      } catch {
        // Vercelissä tiedostojärjestelmä on vain luku -tilassa (read-only), jolloin käytetään pilvitallennusta
      }

      // Yritetään tallentaa myös Supabase Storageen, jotta video toimii suoraan Vercelin pilvessä ilman git pushia
      const sb = getSupabaseServerClient();
      if (sb) {
        try {
          // Varmistetaan julkinen bucket "videos"
          await sb.storage.createBucket('videos', {
            public: true,
            fileSizeLimit: 52428800, // 50 MB
          }).catch(() => {});

          const storagePath = `${fileName}`;
          const { error: uploadErr } = await sb.storage
            .from('videos')
            .upload(storagePath, buffer, {
              contentType: file.type || 'video/mp4',
              upsert: true,
            });

          if (!uploadErr) {
            const { data: pubData } = sb.storage.from('videos').getPublicUrl(storagePath);
            if (pubData?.publicUrl) {
              // Lisätään aikaleima välimuistin ohittamiseen
              finalVideoUrl = `${pubData.publicUrl}?t=${Date.now()}`;
            }
          }
        } catch {
          // Jos Supabase Storage ei ole käytössä, käytetään paikallista polkua
        }
      }

      if (!savedLocally && finalVideoUrl.startsWith('/videos/')) {
        return NextResponse.json(
          {
            success: false,
            error:
              'Vercelin palvelimelle ei voi kirjoittaa suoraan ilman pilvi-buckettia. Voit joko ladata MP4-tiedoston paikallisesti ja puskea Gitiin TAI liittää videon suoran URL-osoitteen kenttään.',
          },
          { status: 500 }
        );
      }

      const result = await handleUpdateNodeVideo(nodeKey, finalVideoUrl, adminPin);

      if (!result.success) {
        return NextResponse.json(result, { status: 401 });
      }

      return NextResponse.json({
        success: true,
        videoUrl: finalVideoUrl,
        node: result.node,
      });
    }

    // 2. Jos tallennetaan suoraan videon URL-osoite (JSON)
    const body = await req.json();
    const { nodeKey, videoUrl, adminPin } = body;

    if (!nodeKey || !videoUrl || !adminPin) {
      return NextResponse.json(
        { success: false, error: 'nodeKey, videoUrl ja adminPin ovat pakollisia.' },
        { status: 400 }
      );
    }

    const result = await handleUpdateNodeVideo(String(nodeKey), String(videoUrl), String(adminPin));
    if (!result.success) {
      return NextResponse.json(result, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      videoUrl: result.node?.video_url || videoUrl,
      node: result.node,
    });
  } catch (error: any) {
    console.error('Upload video error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Videon tallennus epäonnistui: ' + (error?.message || 'Palvelinvirhe'),
      },
      { status: 500 }
    );
  }
}

