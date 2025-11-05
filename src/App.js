import React from 'react';
import CarouselStack from './components/CarouselStack';

import upperPart from './assets/upper part.jpeg';
import timeImage from './assets/time.jpg';
import img1 from './assets/IMG 1.jpg';
import img2 from './assets/IMG 2.jpg';
import img3 from './assets/IMG 3.jpg';

function App() {
  return (
    <div>
      <CarouselStack
        upperSrc={upperPart}
        timeSrc={timeImage}
        bottomImgs={[img1, img2, img3]}
      />
    </div>
  );
}

export default App;
