import { setupArtistProfile } from './actions'

export default function ArtistOnboardingPage() {
  return (
    <div className="max-w-md mx-auto mt-20 p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6 text-center">Set Up Your Artist Profile</h1>
      <p className="text-gray-600 mb-8 text-sm text-center">
        Complete these details to unlock your artist dashboard and start selling.
      </p>

      <form action={setupArtistProfile} className="space-y-4">
        <div>
          <label htmlFor="specialty" className="block text-sm font-medium text-gray-700">
            Specialty (e.g., Digital Illustration, Oil Painting)
          </label>
          <input
            type="text"
            id="specialty"
            name="specialty"
            required
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-black focus:outline-none"
            placeholder="What is your main medium?"
          />
        </div>

        <div>
          <label htmlFor="location" className="block text-sm font-medium text-gray-700">
            Location
          </label>
          <input
            type="text"
            id="location"
            name="location"
            required
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-black focus:outline-none"
            placeholder="City or Region"
          />
        </div>

        <div>
          <label htmlFor="price_range" className="block text-sm font-medium text-gray-700">
            Starting Price Range
          </label>
          <input
            type="text"
            id="price_range"
            name="price_range"
            required
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-black focus:outline-none"
            placeholder="e.g., ₱500 - ₱5,000"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-black text-white py-2 px-4 rounded-md hover:bg-gray-800 transition-colors font-medium pt-4"
        >
          Complete Setup
        </button>
      </form>
    </div>
  )
}