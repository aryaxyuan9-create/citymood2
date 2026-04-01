import exifr from 'exifr'

export async function readGPS(file) {
  try {
    const gps = await exifr.gps(file)
    if (!gps?.latitude || !gps?.longitude) return null
    return { lat: gps.latitude, lng: gps.longitude }
  } catch {
    return null
  }
}
