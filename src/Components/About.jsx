import { motion } from 'framer-motion';

const About = () => {
  return (
    <section id="about" className="py-16 px-6 md:px-20 bg-gray-50">
      <motion.div
        className="max-w-4xl mx-auto text-center"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <h2 className="text-3xl md:text-5xl font-bold mb-6 text-blue-600">About Me</h2>
        <p className="text-lg md:text-xl text-gray-700 leading-relaxed">
          I'm a passionate <span className="font-semibold text-blue-500">Website Application Developer</span> with a strong focus on delivering high-performance web solutions. <br /><br />
          Alongside development, I specialize in <span className="font-semibold text-blue-500">Search Engine Optimization (SEO)</span> to boost online visibility and drive organic traffic. <br /><br />
          I'm also experienced in <span className="font-semibold text-blue-500">Social Media Marketing (SMM)</span>, helping brands connect and grow across digital platforms.
        </p>
      </motion.div>
    </section>
  );
};

export default About;
