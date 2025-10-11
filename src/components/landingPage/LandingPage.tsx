import React, { useState, useEffect, useRef } from 'react';
import { sendContactMessage } from "../../api/components/contactApi";
import PolicyModal from "./PolicyModal";

import "../../styles/pages/LandingPage.css";
import { useI18n } from "../../i18n";

// ✅ Custom Hook ถูกต้องแล้ว
function useInView(threshold = 0.2) {
    const ref = useRef<HTMLDivElement | null>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const element = ref.current;
        const observer = new IntersectionObserver(
            ([entry]) => setIsVisible(entry.isIntersecting),
            { threshold }
        );

        if (element) observer.observe(element);

        return () => {
            if (element) observer.unobserve(element);
        };
    }, [threshold]);

    return [ref, isVisible] as const;
}

// ✅ ภาพต่าง ๆ
const galleryImages = [
    'https://res.cloudinary.com/dboau6axv/image/upload/v1752055539/IMG_3265_dxyju4.jpg',
    'https://res.cloudinary.com/dboau6axv/image/upload/v1752055537/IMG_3270_mqeq6s.jpg',
    'https://res.cloudinary.com/dboau6axv/image/upload/v1752055536/IMG_3272_wqaape.jpg',
    'https://res.cloudinary.com/dboau6axv/image/upload/v1752055536/IMG_3274_kzd4lw.jpg',
];

const miniGallery = [
    'https://res.cloudinary.com/dboau6axv/image/upload/v1752055538/IMG_3273_peyrka.jpg',
    'https://res.cloudinary.com/dboau6axv/image/upload/v1752055539/IMG_3264_jqmiz2.jpg',
    'https://res.cloudinary.com/dboau6axv/image/upload/v1752055539/IMG_3268_bmtqva.jpg',
];

const Home: React.FC = () => {
    const { t } = useI18n();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [heroRef, heroVisible] = useInView();
    const [serviceRef, serviceVisible] = useInView();
    const [contactRef, contactVisible] = useInView();
    const [showPolicy, setShowPolicy] = useState(false);
    const [showTerms, setShowTerms] = useState(false);


    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentIndex((prev) =>
                prev === galleryImages.length - 1 ? 0 : prev + 1
            );
        }, 4000);

        return () => clearInterval(interval);
    }, []);

    const handleRadioChange = (index: number) => {
        setCurrentIndex(index);
    };
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        message: "",
    });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState("");
    const [error, setError] = useState("");

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setSuccess("");
        setError("");

        try {
            await sendContactMessage(formData);
            setSuccess(t('landing.contact.success'));
            setFormData({ name: "", email: "", message: "" });
        } catch (err: any) {
            setError(t('landing.contact.error'));
        } finally {
            setLoading(false);
        }
    };
    return (
        <div className="homepage">
            {/* ✅ Hero Section */}
            <section
                ref={heroRef}
                className={`homepage-hero-section fade-in-section ${heroVisible ? 'visible' : ''}`}
            >
                <div className="homepage-hero-content">
                    <img
                        src="https://res.cloudinary.com/dboau6axv/image/upload/v1752492378/head_jpq86y.png"
                        alt="Hero Banner"
                        className="hero-image"
                    />
                </div>
            </section>
            <div className="homepage-hero-content">
                <h1>{t('landing.companyName')}</h1>
                <h2>
                    {t('landing.subtitle')} 
                </h2>
                <br />
            </div>

            {/* ✅ Slideshow */}
            <section className="homepage-slideshow-section">
                <div className="homepage-slideshow">
                    <div className="homepage-slide-container">
                        {galleryImages.map((url, index) => (
                            <div
                                className={`homepage-slide ${index === currentIndex ? 'active' : ''}`}
                                key={index}
                            >
                                <div
                                    className="homepage-bg-cover"
                                    style={{ backgroundImage: `url(${url})` }}
                                />
                            </div>
                        ))}
                    </div>

                    <div className="homepage-radio-indicators">
                        {galleryImages.map((_, index) => (
                            <label key={index}>
                                <input
                                    type="radio"
                                    name="gallery-radio"
                                    checked={index === currentIndex}
                                    onChange={() => handleRadioChange(index)}
                                />
                                <span className="radio-dot" />
                            </label>
                        ))}
                    </div>
                </div>
            </section>

            {/* ✅ Company Capabilities */}
            <section
                ref={serviceRef}
                className={`homepage-section fade-in-section ${serviceVisible ? 'visible' : ''}`}
            >
                <h2 className="homepage-section-title">{t('landing.capabilities')}</h2>
                <div className="homepage-card-grid">
                    <div className="homepage-service-card">
                        <div className="homepage-icon">🚛</div>
                        <h3>{t('landing.cap.headTruck')}</h3>
                        <p>{t('landing.cap.headTruck.desc')}</p>
                    </div>
                    <div className="homepage-service-card">
                        <div className="homepage-icon">📦</div>
                        <h3>{t('landing.cap.coldContainer')}</h3>
                        <p>{t('landing.cap.coldContainer.desc')}</p>
                    </div>
                    <div className="homepage-service-card">
                        <div className="homepage-icon">🏢</div>
                        <h3>{t('landing.cap.yard')}</h3>
                        <p>{t('landing.cap.yard.desc')}</p>
                    </div>

                    {/* Mini Gallery */}
                    <div className="homepage-mini-gallery-grid">
                        {miniGallery.slice(0, 6).map((url, i) => (
                            <div
                                className="mini-image-grid-item"
                                key={`mini-${i}`}
                                style={{ backgroundImage: `url(${url})` }}
                            />
                        ))}
                    </div>
                </div>
            </section>

            {/* ✅ Services */}
            <section className="homepage-section" style={{ marginTop: '-50px' }}>
                <h2 className="homepage-section-title">{t('landing.services')}</h2>
                <div className="homepage-card-grid">
                    <div className="homepage-service-card">
                        <div className="homepage-icon">🌍</div>
                        <h3>{t('landing.service.importExport')}</h3>
                        <p>{t('landing.service.importExport.desc')}</p>
                    </div>
                    <div className="homepage-service-card">
                        <div className="homepage-icon">🚚</div>
                        <h3>{t('landing.service.crossBorder')}</h3>
                        <p>{t('landing.service.crossBorder.desc')}</p>
                    </div>
                    <div className="homepage-service-card">
                        <div className="homepage-icon">🥬</div>
                        <h3>{t('landing.service.fresh')}</h3>
                        <p>{t('landing.service.fresh.desc')}</p>
                    </div>
                    <div className="homepage-service-card">
                        <div className="homepage-icon">📋</div>
                        <h3>{t('landing.service.logistics')}</h3>
                        <p>{t('landing.service.logistics.desc')}</p>
                    </div>
                </div>
            </section>

            {/* ✅ Company Mission */}
            <section className="homepage-section" style={{ backgroundColor: '#f8fafc', marginBottom: '100px' }}>
                <h2 className="homepage-section-title">{t('landing.mission')}</h2>
                <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
                    <p style={{ fontSize: '1.2rem', lineHeight: '1.8', color: '#475569' }}>
                        "{t('landing.mission.quote')}"
                    </p>
                </div>
            </section>

            {/* ✅ Contact */}
            <section
                ref={contactRef}
                className={`homepage-section contact-section fade-in-section ${contactVisible ? 'visible' : ''}`}
            >
                <h2 className="homepage-section-title">{t('landing.contact')}</h2>
                <form className="contact-form" onSubmit={handleSubmit}>
                    <input
                        type="text"
                        name="name"
                        placeholder={t('landing.contact.name')}
                        value={formData.name}
                        onChange={handleChange}
                        required
                    />
                    <input
                        type="email"
                        name="email"
                        placeholder={t('landing.contact.email')}
                        value={formData.email}
                        onChange={handleChange}
                        required
                    />
                    <textarea
                        name="message"
                        rows={5}
                        placeholder={t('landing.contact.message')}
                        value={formData.message}
                        onChange={handleChange}
                        required
                    />
                    <button type="submit" disabled={loading}>
                        {loading ? t('landing.contact.sending') : t('landing.contact.submit')}
                    </button>
                    {success && <p className="success-message">{success}</p>}
                    {error && <p className="error-message">{error}</p>}
                </form>

                <div className="contact-channels">
                    <h3>{t('landing.contact.other')}</h3>
                    <ul>
                        <li><strong>Email:</strong> <a href="mailto:porchoen2014@gmail.com">porchoen2014@gmail.com</a></li>
                        <li><strong>LINE:</strong> <span>@porchoen2014</span></li>
                        <li><strong>WeChat:</strong> <span>porchoen2014</span></li>
                        <li>
                            <strong>{t('landing.contact.address')}:</strong>{' '}
                            <a
                                href="https://maps.app.goo.gl/S32zkAHDFhueuQPp9"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                61/36-37 ซอยทวีมิตร 6 ถนนพระราม9 ห้วยขวาง เขตห้วยขวาง กรุงเทพมหานคร 10310 ประเทศไทย
                            </a>
                        </li>
                    </ul>
                </div>
            </section>

            <footer className="homepage-footer">
                <div className="footer-links" style={{ textAlign: "center", marginTop: "3rem" }}>
                    <span onClick={() => setShowPolicy(true)} className="footer-link">{t('landing.privacy')}</span> |
                    <span onClick={() => setShowTerms(true)} className="footer-link">{t('landing.terms')}</span>

                    {/* Modals */}
                    <PolicyModal
                        isVisible={showPolicy}
                        onClose={() => setShowPolicy(false)}
                        title={t('landing.privacy') as any}
                    />

                    <PolicyModal
                        isVisible={showTerms}
                        onClose={() => setShowTerms(false)}
                        title={t('landing.terms') as any}
                    />

                </div>
                <p>{t('landing.copyright')}</p>
            </footer>
        </div>
    );
};

export default Home;
