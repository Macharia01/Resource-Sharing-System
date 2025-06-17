import communityImg from './Assets/Images/community.jpg';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-[#2e1f25] to-[#e192a3] text-white font-sans">
      {/* Navbar */}
      <header className="flex justify-between items-center p-6 bg-white shadow">
        <h1 className="text-xl font-bold text-pink-600">ShareNet</h1>
        <nav className="space-x-6">
          <a href="#" className="text-gray-600 hover:text-pink-500">Browse</a>
          <a href="#how-it-works" className="text-gray-600 hover:text-pink-500">How It Works</a>
          <a href="#categories" className="text-gray-600 hover:text-pink-500">Categories</a>
          <a href="#" className="text-gray-600 hover:text-pink-500">Login</a>
          <a href="#" className="px-4 py-2 bg-pink-600 text-white rounded hover:bg-pink-700">Sign Up</a>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="flex flex-col md:flex-row items-center justify-between px-6 md:px-20 py-16">
        <div className="md:w-1/2 text-center md:text-left">
          <h2 className="text-4xl font-bold text-pink-700 mb-4">
            Empower Your Neighborhood with Shared Resources
          </h2>
          <p className="text-gray-100 mb-6 text-lg">
            ShareNet connects people to lend and borrow tools, books, and services — making communities stronger through trust and collaboration.
          </p>
          <a href="#" className="bg-pink-600 text-white px-6 py-3 rounded shadow hover:bg-pink-700">
            Get Started
          </a>
        </div>
        <div className="md:w-1/2 mt-10 md:mt-0">
          <img
            src={communityImg}
            alt="Community sharing"
            className="w-full max-w-md mx-auto rounded-lg shadow-lg"
          />
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-16 bg-white text-gray-900 px-6 md:px-20">
        <h3 className="text-3xl font-bold text-center mb-10">How It Works</h3>
        <div className="grid md:grid-cols-3 gap-8 text-center">
          <div>
            <div className="text-pink-600 text-4xl mb-4">📝</div>
            <h4 className="font-semibold text-xl mb-2">Sign Up</h4>
            <p>Create an account and join a network of trusted neighbors.</p>
          </div>
          <div>
            <div className="text-pink-600 text-4xl mb-4">📦</div>
            <h4 className="font-semibold text-xl mb-2">List or Browse</h4>
            <p>Offer resources you own or browse what others are sharing.</p>
          </div>
          <div>
            <div className="text-pink-600 text-4xl mb-4">🔁</div>
            <h4 className="font-semibold text-xl mb-2">Request & Share</h4>
            <p>Send or accept requests, then arrange collection and return.</p>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section id="categories" className="py-16 bg-gray-100 text-gray-900 px-6 md:px-20">
        <h3 className="text-3xl font-bold text-center mb-10">Popular Categories</h3>
        <div className="grid md:grid-cols-4 gap-8 text-center">
          <div className="bg-white rounded-lg p-6 shadow hover:shadow-lg transition">
            <h4 className="font-semibold text-xl mb-2">Tools & Equipment</h4>
            <p>Drills, ladders, power washers, and more.</p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow hover:shadow-lg transition">
            <h4 className="font-semibold text-xl mb-2">Books & Stationery</h4>
            <p>Novels, textbooks, art supplies, and paper goods.</p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow hover:shadow-lg transition">
            <h4 className="font-semibold text-xl mb-2">Kitchen Items</h4>
            <p>Blenders, baking pans, slow cookers, and more.</p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow hover:shadow-lg transition">
            <h4 className="font-semibold text-xl mb-2">Sports & Outdoor</h4>
            <p>Tents, bikes, camping gear, and recreational kits.</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-pink-600 text-white text-center px-6">
        <h3 className="text-3xl font-bold mb-4">Start Sharing Today</h3>
        <p className="mb-6 max-w-xl mx-auto">
          Join ShareNet and make your neighborhood more connected, efficient, and sustainable. 
        </p>
        <a href="#" className="bg-white text-pink-600 px-6 py-3 font-semibold rounded shadow hover:bg-gray-100 transition">
          Join Now
        </a>
      </section>

      {/* Footer */}
      <footer className="text-center text-sm text-gray-300 py-6 bg-black border-t border-gray-800">
        &copy; {new Date().getFullYear()} ShareNet. All rights reserved.
      </footer>
    </div>
  );
}

export default App;
