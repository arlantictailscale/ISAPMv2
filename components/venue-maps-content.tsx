export function VenueMapsContent() {
  return (
    <div className="space-y-6">
      {/* Google Maps Embed */}
      <div className="w-full rounded-lg overflow-hidden shadow-lg h-96">
        <iframe
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3951.3445!2d112.5500174!3d-7.8930086!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2dd629b8b0c0c0c1:0x7f8b9a8c7d6e5f4a!2sThe%20Singhasari%20Resort%20Batu!5e0!3m2!1sen!2sid!4v1234567890123!5m2!1sen!2sid"
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="The Singhasari Resort Batu Location on Google Maps"
        />
      </div>

      {/* Location Info Card */}
      <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-6 rounded-lg border border-slate-200">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Visit Us</h3>
        <div className="space-y-3">
          <p className="text-gray-700">
            <span className="font-semibold">Address:</span> Jalan Raya Batu, Batu, East Java, Indonesia
          </p>
          <p className="text-gray-700">
            <span className="font-semibold">GPS Coordinates:</span> -7.8930086, 112.5500174
          </p>
          <a
            href="https://www.google.com/maps/search/?api=1&query=-7.8930086,112.5500174"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-4 px-6 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors font-medium"
          >
            Open in Google Maps
          </a>
        </div>
      </div>
    </div>
  )
}
