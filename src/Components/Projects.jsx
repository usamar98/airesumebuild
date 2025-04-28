import { Swiper, SwiperSlide } from "swiper/react";
import { motion } from "framer-motion";
import "swiper/css";
import "swiper/css/pagination";
import { Pagination } from "swiper/modules";

// Import your screenshots in assets
import ZcraveImg from "../assets/ZcraveImg.jpg";
import MdhImg from "../assets/Rectangle-5.png";
import LoopsImg from "../assets/LoopsImg.png";
import BookmaarksImg from "../assets/BookmaarksImg.png";

const Projects = () => {
  const projectData = [
    {
      title: "ZCRAVE - E-commerce Website",
      description:
        "A premium fashion e-commerce website showcasing modern style and trends.",
      link: "https://zcrave.com/",
      image: ZcraveImg,
      stack: ["Shopify", "Liquid", "SEO"],
    },
    {
      title: "MDH - Media Depot Website",
      description:
        "A professional web app designed for media management and digital solutions.",
      link: "https://mediadepottest1.com/mdh/",
      image: MdhImg,
      stack: ["React", "Tailwind", "SEO"],
    },
    {
      title: "Loops Studio - Landing Page",
      description:
        "A modern animated landing page built with Tailwind CSS and responsive design.",
      link: "https://loopsstudio.netlify.app/",
      image: LoopsImg,
      stack: ["HTML", "Tailwind CSS", "JavaScript"],
    },
    {
      title: "Bookmaarks - Bookmark App",
      description:
        "A web app to manage, save and revisit bookmarks with a clean UI.",
      link: "https://bookmaarked.netlify.app/",
      image: BookmaarksImg,
      stack: ["React", "Tailwind", "Netlify"],
    },
  ];

  return (
    <section id="projects" className="py-16 px-6 md:px-20 bg-white">
      <div className="max-w-5xl mx-auto text-center">
        <motion.h2
          className="text-3xl md:text-5xl font-bold text-blue-600 mb-10"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          Projects
        </motion.h2>

        <Swiper
          modules={[Pagination]}
          spaceBetween={30}
          pagination={{ clickable: true }}
          breakpoints={{
            0: {
              slidesPerView: 1,
            },
            768: {
              slidesPerView: 2,
            },
          }}
          className="w-full"
        >
          {projectData.map((project, index) => (
            <SwiperSlide key={index}>
              <motion.div
                className="bg-gray-100 rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-300 max-w-xl mx-auto"
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
              >
                <img
                  src={project.image}
                  alt={project.title}
                  className="rounded-lg w-full h-60 object-cover mb-4"
                />
                <h3 className="text-2xl font-semibold text-gray-800 mb-2">
                  {project.title}
                </h3>
                <p className="text-gray-600 mb-4">{project.description}</p>
                <div className="flex justify-center gap-2 mb-4 flex-wrap">
                  {project.stack.map((tech, i) => (
                    <span
                      key={i}
                      className="text-sm bg-blue-100 text-blue-600 px-2 py-1 rounded-full"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
                <a
                  href={project.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block text-blue-500 hover:text-blue-700 font-medium"
                >
                  Visit Site →
                </a>
              </motion.div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
};

export default Projects;
