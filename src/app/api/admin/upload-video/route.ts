import { NextResponse } from 'next/server';
import { handleUpdateNodeVideo } from '@/lib/gameServer';
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

      const num = nodeKey.replace(/[^0-9]/g, '').padStart(2, '0');
      const fileName = `node${num}.mp4`;
      const videosDir = path.join(process.cwd(), 'public', 'videos');
      await mkdir(videosDir, { recursive: true });

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const targetPath = path.join(videosDir, fileName);

      await writeFile(targetPath, buffer);

      const publicVideoUrl = `/videos/${fileName}`;
      const result = await handleUpdateNodeVideo(nodeKey, publicVideoUrl, adminPin);

      if (!result.success) {
        return NextResponse.json(result, { status: 401 });
      }

      return NextResponse.json({
        success: true,
        videoUrl: publicVideoUrl,
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
