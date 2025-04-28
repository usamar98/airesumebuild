import { useRef } from 'react';
import emailjs from '@emailjs/browser';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const Contact = () => {
  const form = useRef();

  const sendEmail = (e) => {
    e.preventDefault();

    toast.loading('Sending message...');

    emailjs.sendForm(
      'your_service_id',
      'your_template_id',
      form.current,
      'your_public_key'
    ).then((result) => {
      toast.dismiss(); // close loading toast
      toast.success('Message sent successfully!');
      e.target.reset();
    }).catch((error) => {
      toast.dismiss();
      toast.error('Failed to send message. Try again later.');
      console.error(error.text);
    });
  };

  return (
    <section id="contact" className="py-16 px-6 md:px-20 bg-gray-100">
      <motion.div
        className="max-w-xl mx-auto text-center"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <h2 className="text-3xl md:text-5xl font-bold text-blue-600 mb-8">Contact Me</h2>
        <p className="text-gray-600 mb-10">
          Have a project in mind or just want to say hello? Fill out the form and I’ll get back to you shortly.
        </p>

        <form ref={form} onSubmit={sendEmail} className="flex flex-col gap-5 text-left">
          <label className="text-sm text-gray-700">
            Name
            <input
              type="text"
              name="user_name"
              placeholder="Your Name"
              className="w-full mt-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
            />
          </label>

          <label className="text-sm text-gray-700">
            Email
            <input
              type="email"
              name="user_email"
              placeholder="Your Email"
              className="w-full mt-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
            />
          </label>

          <label className="text-sm text-gray-700">
            Message
            <textarea
              name="message"
              rows="5"
              placeholder="Your Message"
              className="w-full mt-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
            ></textarea>
          </label>

          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 transition-all text-white font-semibold py-3 rounded-lg"
          >
            Send Message
          </button>
        </form>
      </motion.div>
    </section>
  );
};

export default Contact;
