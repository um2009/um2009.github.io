import type { PlanetData } from '../../types';
import Sun from './Sun';
import Planet from './Planet';
import Starfield from './Starfield';
import CameraRig from './CameraRig';
import Effects from './Effects';

interface Props {
  planets: PlanetData[];
}

export default function SolarSystem({ planets }: Props) {
  return (
    <>
      {/* Low ambient keeps night sides dark so sun shadows read clearly */}
      <ambientLight intensity={0.35} />
      <Sun />
      {planets.map((planet) => (
        <Planet key={planet.id} planet={planet} />
      ))}
      <Starfield />
      <CameraRig planets={planets} />
      <Effects />
    </>
  );
}
