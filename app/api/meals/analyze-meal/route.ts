import { NextRequest, NextResponse } from 'next/server';
import { analyzeFood } from '@/lib/ai';

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';

    let foods: any[] = [];
    let locationType: string | undefined;
    let restaurantName: string | undefined;
    let imageBase64: string | undefined;

    if (contentType.includes('multipart/form-data')) {
      // Com foto
      const formData = await req.formData();
      const image = formData.get('image') as File;
      const dataStr = formData.get('data') as string;

      if (dataStr) {
        const data = JSON.parse(dataStr);
        foods = data.foods || [];
        locationType = data.location_type;
        restaurantName = data.restaurant_name;
      }

      if (image) {
        const bytes = await image.arrayBuffer();
        const buffer = Buffer.from(bytes);
        imageBase64 = `data:${image.type};base64,${buffer.toString('base64')}`;
      }
    } else {
      // Sem foto
      const body = await req.json();
      foods = body.foods || [];
      locationType = body.location_type;
      restaurantName = body.restaurant_name;
    }

    if (foods.length === 0) {
      return NextResponse.json(
        { error: 'Nenhum alimento fornecido' },
        { status: 400 }
      );
    }

    // Montar prompt para IA
    const foodsDescription = foods.map((f: any) => {
      if (f.calories && f.protein_g) {
        // Alimento do banco - já tem valores nutricionais
        return `${f.name} (${f.quantity} ${f.unit}) - Do banco de alimentos: ${f.calories} kcal, ${f.protein_g}g proteína, ${f.carbs_g}g carboidrato, ${f.fat_g}g gordura`;
      } else {
        // Alimento novo - precisa estimar
        return `${f.name} (${f.quantity} ${f.unit}) - Novo alimento, precisa estimar valores nutricionais`;
      }
    }).join('\n');

    let description = `Analise esta refeição:\n\n${foodsDescription}`;

    if (locationType === 'out' && restaurantName) {
      description += `\n\nLocal: ${restaurantName}`;
    }

    if (imageBase64) {
      description += '\n\n(Foto da refeição anexada para contexto adicional)';
    }

    // Chamar IA
    const result = await analyzeFood(description, imageBase64);

    return NextResponse.json({ result });
  } catch (error: any) {
    console.error('Erro ao analisar refeição:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao analisar refeição' },
      { status: 500 }
    );
  }
}
