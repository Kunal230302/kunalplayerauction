'use client'
import { useState } from 'react'

export default function OverlayHelp() {
  const [activeTab, setActiveTab] = useState('obs')

  return (
    <div className="min-h-screen bg-gradient-to-br from-saffron-50 to-orange-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-4xl font-bold text-saffron-600 mb-2">🎬 Overlay Setup Guide</h1>
          <p className="text-gray-600 mb-8">Complete guide for streaming auction overlays on all devices</p>

          {/* Tab Navigation */}
          <div className="flex gap-2 mb-8 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('obs')}
              className={`px-6 py-3 font-semibold transition-all ${activeTab === 'obs' 
                ? 'text-saffron-600 border-b-2 border-saffron-600' 
                : 'text-gray-500 hover:text-gray-700'}`}
            >
              📺 Professional OBS
            </button>
            <button
              onClick={() => setActiveTab('mobile')}
              className={`px-6 py-3 font-semibold transition-all ${activeTab === 'mobile' 
                ? 'text-saffron-600 border-b-2 border-saffron-600' 
                : 'text-gray-500 hover:text-gray-700'}`}
            >
              🎥 Mobile Stream
            </button>
          </div>

          {/* Professional OBS Overlay Instructions */}
          {activeTab === 'obs' && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <h2 className="text-2xl font-bold text-blue-800 mb-4">📺 Professional OBS Overlay</h2>
                <p className="text-blue-700 mb-4">Full-screen professional overlay for OBS Studio - Perfect for professional streaming</p>
                
                <div className="bg-white rounded-lg p-4 mb-4">
                  <h3 className="font-bold text-lg mb-2">🔗 Overlay URL:</h3>
                  <code className="bg-gray-100 px-3 py-2 rounded text-sm">yoursite.com/overlay?tid=TOURNAMENT_ID</code>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg p-4">
                    <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                      💻 PC/Mac Setup
                    </h3>
                    <ol className="space-y-2 text-sm">
                      <li>1. Open OBS Studio</li>
                      <li>2. Add Source → Browser</li>
                      <li>3. URL: yoursite.com/overlay?tid=TOURNAMENT_ID</li>
                      <li>4. Width: 1920, Height: 1080</li>
                      <li>5. Custom CSS: body {'{'} background: transparent; {'}'}</li>
                    </ol>
                  </div>

                  <div className="bg-white rounded-lg p-4">
                    <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                      📱 Mobile Viewing
                    </h3>
                    <ol className="space-y-2 text-sm">
                      <li>1. Open browser on mobile</li>
                      <li>2. Go to overlay URL</li>
                      <li>3. Enter fullscreen mode</li>
                      <li>4. Cast to TV/streaming software</li>
                      <li>5. Use screen mirroring apps</li>
                    </ol>
                  </div>

                  <div className="bg-white rounded-lg p-4">
                    <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                      🍎 iOS/iPhone Setup
                    </h3>
                    <ol className="space-y-2 text-sm">
                      <li>1. Open Safari browser</li>
                      <li>2. Visit overlay URL</li>
                      <li>3. Tap fullscreen icon</li>
                      <li>4. AirPlay to Apple TV</li>
                      <li>5. Use Streamlabs mobile app</li>
                    </ol>
                  </div>

                  <div className="bg-white rounded-lg p-4">
                    <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                      📲 Android Setup
                    </h3>
                    <ol className="space-y-2 text-sm">
                      <li>1. Open Chrome browser</li>
                      <li>2. Go to overlay URL</li>
                      <li>3. Enter fullscreen mode</li>
                      <li>4. Use screen recording apps</li>
                      <li>5. Cast to Chromecast/TV</li>
                    </ol>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                <h3 className="font-bold text-lg mb-3">✨ Features:</h3>
                <ul className="space-y-2 text-sm text-green-800">
                  <li>• Full 1920x1080 professional layout</li>
                  <li>• Real-time bidding animations</li>
                  <li>• Player photos and details</li>
                  <li>• Timer with visual alerts</li>
                  <li>• Team statistics bar</li>
                  <li>• Confetti effects for sold players</li>
                </ul>
              </div>
            </div>
          )}

          {/* Mobile Stream Overlay Instructions */}
          {activeTab === 'mobile' && (
            <div className="space-y-6">
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
                <h2 className="text-2xl font-bold text-purple-800 mb-4">🎥 Mobile Stream Overlay</h2>
                <p className="text-purple-700 mb-4">Compact overlay optimized for mobile streaming and social media platforms</p>
                
                <div className="bg-white rounded-lg p-4 mb-4">
                  <h3 className="font-bold text-lg mb-2">🔗 Overlay URL:</h3>
                  <code className="bg-gray-100 px-3 py-2 rounded text-sm">yoursite.com/overlay/youtube</code>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg p-4">
                    <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                      📱 Direct Mobile Streaming
                    </h3>
                    <ol className="space-y-2 text-sm">
                      <li>1. Open phone browser</li>
                      <li>2. Go to overlay URL</li>
                      <li>3. Start YouTube Live from phone</li>
                      <li>4. Use overlay as picture-in-picture</li>
                      <li>5. Stream to TikTok/Instagram</li>
                    </ol>
                  </div>

                  <div className="bg-white rounded-lg p-4">
                    <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                      💻 PC Streaming
                    </h3>
                    <ol className="space-y-2 text-sm">
                      <li>1. Open OBS Studio</li>
                      <li>2. Add Browser Source</li>
                      <li>3. URL: yoursite.com/overlay/youtube</li>
                      <li>4. Position for mobile layout</li>
                      <li>5. Stream to any platform</li>
                    </ol>
                  </div>

                  <div className="bg-white rounded-lg p-4">
                    <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                      🍎 iOS Streaming
                    </h3>
                    <ol className="space-y-2 text-sm">
                      <li>1. Safari → overlay URL</li>
                      <li>2. Fullscreen mode</li>
                      <li>3. Screen recording start</li>
                      <li>4. Stream to YouTube/Facebook</li>
                      <li>5. Use Streamlabs iOS app</li>
                    </ol>
                  </div>

                  <div className="bg-white rounded-lg p-4">
                    <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                      📲 Android Streaming
                    </h3>
                    <ol className="space-y-2 text-sm">
                      <li>1. Chrome → overlay URL</li>
                      <li>2. Enable fullscreen</li>
                      <li>3. Use YouTube Live app</li>
                      <li>4. Stream to Twitch/Facebook</li>
                      <li>5. Try Streamlabs Android</li>
                    </ol>
                  </div>
                </div>
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-xl p-6">
                <h3 className="font-bold text-lg mb-3">🎯 Perfect For:</h3>
                <ul className="space-y-2 text-sm text-orange-800">
                  <li>• Mobile phone streaming</li>
                  <li>• Vertical video formats</li>
                  <li>• Social media live streams</li>
                  <li>• Quick setup streaming</li>
                  <li>• Team scoreboard display</li>
                  <li>• Compact player information</li>
                </ul>
              </div>
            </div>
          )}

          {/* Quick Links */}
          <div className="mt-8 bg-gray-50 rounded-xl p-6">
            <h3 className="font-bold text-lg mb-4">🚀 Quick Links:</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <a 
                href="/overlay" 
                target="_blank"
                className="bg-blue-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-600 transition-colors text-center"
              >
                📺 Open Professional OBS
              </a>
              <a 
                href="/overlay/youtube" 
                target="_blank"
                className="bg-purple-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-600 transition-colors text-center"
              >
                🎥 Open Mobile Stream
              </a>
            </div>
          </div>

          {/* Tips Section */}
          <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-xl p-6">
            <h3 className="font-bold text-lg mb-3">💡 Pro Tips:</h3>
            <ul className="space-y-2 text-sm text-yellow-800">
              <li>• Always test overlays before going live</li>
              <li>• Use tournament ID for multiple auctions: ?tid=TOURNAMENT_NAME</li>
              <li>• Ensure stable internet connection for live streaming</li>
              <li>• Mobile overlays work best in landscape mode</li>
              <li>• Use Streamlabs for easier mobile streaming</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
