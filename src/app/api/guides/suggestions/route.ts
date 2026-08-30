import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { ok, serverError } from '@/lib/api'

// GET /api/guides/suggestions?applianceType=&brand=&model=&symptom=
// Devuelve guías activas relevantes para un equipo en particular.
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const applianceType = searchParams.get('applianceType')
    const brand = searchParams.get('brand')
    const model = searchParams.get('model')
    const symptom = searchParams.get('symptom')

    // Filtros base: siempre guías activas
    const where: any = { status: 'active' }
    if (applianceType) where.applianceType = applianceType
    if (brand) where.brand = brand

    // Traer candidatos y ordenarlos por relevancia en memoria
    const guides = await db.repairGuide.findMany({
      where,
      include: {
        author: { select: { id: true, name: true } },
        sourceWorkOrder: { select: { id: true, code: true } },
      },
      orderBy: [{ usageCount: 'desc' }, { updatedAt: 'desc' }],
      take: 50,
    })

    const needle = (symptom || '').toLowerCase().trim()
    const modelNeedle = (model || '').toLowerCase().trim()

    // Score de relevancia: marca exacta + 4, modelo coincidente + 3,
    // síntoma contenido + 2, título/síntomas con brand genérico + 1
    const scored = guides
      .map((g) => {
        let score = 0
        const match: { brand?: boolean; model?: boolean; symptom?: boolean } = {}
        const gBrand = (g.brand || '').toLowerCase().trim()
        const gModel = (g.model || '').toLowerCase().trim()
        const symptomsRaw = `${g.symptoms || ''} ${g.title || ''}`.toLowerCase()

        if (brand && gBrand === brand.toLowerCase().trim()) {
          score += 4
          match.brand = true
        } else if (gBrand === 'universal') score += 1

        if (modelNeedle && gModel && gModel.includes(modelNeedle)) {
          score += 3
          match.model = true
        }

        if (needle && symptomsRaw.includes(needle)) {
          score += 2
          match.symptom = true
        } else if (needle && needle.length > 3 && symptomsRaw.includes(needle.split(' ')[0])) {
          score += 1
          match.symptom = true
        }

        return { ...g, _score: score, _match: match }
      })
      .filter((g) => (needle ? g._score > 0 : g._score >= 0))
      .sort((a, b) => b._score - a._score)
      .slice(0, 6)
      .map(({ _score, _match, ...rest }) => ({ ...rest, score: _score, match: _match }))

    return ok(scored)
  } catch (e) {
    return serverError('Error al buscar sugerencias', e)
  }
}
