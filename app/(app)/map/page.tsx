import { auth } from '@/lib/auth'
import { getCampusById } from '@/lib/campuses'
import { MapView } from './map-view'

export default async function MapPage() {
  const session = await auth()
  const campus = session?.user?.campus ? getCampusById(session.user.campus) : undefined

  return (
    <MapView
      centerLng={campus?.lng ?? -88.2272}
      centerLat={campus?.lat ?? 40.102}
      zoom={campus?.zoom ?? 15}
    />
  )
}
