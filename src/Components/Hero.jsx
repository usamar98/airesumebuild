import { TypeAnimation } from "react-type-animation";
import MainImg from "../assets/portfolioMain.jpeg";

const Hero = () => {
  return (
    <section className="h-[90vh] flex flex-col justify-center items-center text-center bg-gradient-to-r from-blue-100 to-blue-200">
      <img
        src={MainImg}
        alt="Usama Riaz"
        className="w-40 h-40 md:w-56 md:h-56 object-cover rounded-full mx-auto mb-6 border-4 border-blue-500 shadow-md"
      />
      <TypeAnimation
        sequence={["Hi, I'm Usama Riaz", 1000]}
        speed={30}
        className="text-4xl md:text-6xl font-bold mb-4 text-blue-600"
        repeat={Infinity}
      />
      <p className="text-lg md:text-xl text-gray-700">
        Website Application Developer | Search Engine Optimization(SEO) | Social
        Media Marketing(SMM)
      </p>
    </section>
  );
};
export default Hero;
