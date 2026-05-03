import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { Button } from "@/components/ui/button";
import { 
  ChevronRight, ArrowLeft, User, Gift, Sun, Sunset, Moon, 
  ThermometerSun, Snowflake, CloudRain, Briefcase, PartyPopper, 
  Heart, Shirt, Sparkles, Zap, DollarSign, Crown, Droplets, Check
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const quizQuestions = [
  {
    id: "for_who",
    question: "Para quem é o perfume?",
    options: [
      { label: "Para mim mesmo(a)", value: "self", icon: User, desc: "Descubra sua própria assinatura olfativa" },
      { label: "É para dar de presente", value: "gift", icon: Gift, desc: "Ajudaremos você a escolher o presente perfeito" },
    ]
  },
  {
    id: "time_of_day",
    question: "Em qual período o perfume será mais usado?",
    options: [
      { label: "Dia", value: "dia", tag: "dia", icon: Sun, desc: "Luminoso, fresco e contagiante" },
      { label: "Tarde", value: "tarde", tag: "tarde", icon: Sunset, desc: "Aconchegante e envolvente" },
      { label: "Noite", value: "noite", tag: "noite", icon: Moon, desc: "Elegância, mistério e sedução" },
    ]
  },
  {
    id: "weather",
    question: "Qual o clima predominante?",
    options: [
      { label: "Dias Quentes", value: "calor", tag: "calor", icon: ThermometerSun, desc: "Calor do verão, pede refrescancia" },
      { label: "Dias Frios", value: "frio", tag: "frio", icon: Snowflake, desc: "Inverno e noites geladas" },
      { label: "Clima Ameno", value: "ameno", tag: "ameno", icon: CloudRain, desc: "Meia estação, equilibrado e suave" },
    ]
  },
  {
    id: "occasion",
    question: "Qual a ocasião ideal para esse perfume?",
    options: [
      { label: "Dia a dia / Casual", value: "casual", tag: "dia-a-dia", icon: Zap, desc: "Versátil para qualquer hora" },
      { label: "Encontro Romântico", value: "romantic", tag: "romantico", icon: Heart, desc: "Para atrair e apaixonar" },
      { label: "Festa / Balada", value: "party", tag: "festa", icon: PartyPopper, desc: "Para chegar de forma marcante" },
      { label: "Trabalho / Escritório", value: "work", tag: "trabalho", icon: Briefcase, desc: "Profissional, sério e de atitude" },
    ]
  },
  {
    id: "clothes",
    question: "Qual o seu estilo de roupa favorito?",
    subtitle: "Pode escolher mais de um estilo",
    multiple: 2,
    options: [
      { label: "Casual / Básico", value: "casual", tag: "casual", icon: Shirt, desc: "Conforto acima de tudo" },
      { label: "Elegante / Clássico", value: "elegante", tag: "elegante", icon: Briefcase, desc: "Sofisticação e alfaiataria" },
      { label: "Esportivo", value: "esportivo", tag: "esportivo", icon: Droplets, desc: "Praticidade e performance" },
      { label: "Fashionista", value: "ousado", tag: "ousado", icon: Sparkles, desc: "Ousadia e estilo único" },
    ]
  },
  {
    id: "family",
    question: "Quais estilos de aroma você prefere?",
    subtitle: "Selecione quantos quiser — quanto mais você marcar, mais preciso fica.",
    multiple: 10,
    imageCards: true,
    gridCols: "grid-cols-2 md:grid-cols-3 lg:grid-cols-5",
    options: [
      { label: "Amadeirado", value: "amadeirado", tag: "amadeirado", image: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&q=80&w=300&h=200" },
      { label: "Cítrico", value: "citrico", tag: "citrico", image: "https://images.unsplash.com/photo-1513623935137-c10ba1b58531?auto=format&fit=crop&q=80&w=300&h=200" },
      { label: "Doce", value: "doce", tag: "doce", image: "https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&q=80&w=300&h=200" },
      { label: "Floral", value: "floral", tag: "floral", image: "https://images.unsplash.com/photo-1490682143684-14369e18dce8?auto=format&fit=crop&q=80&w=300&h=200" },
      { label: "Frutado", value: "frutado", tag: "frutado", image: "https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&q=80&w=300&h=200" },
      { label: "Fresco", value: "fresco", tag: "fresco", image: "https://images.unsplash.com/photo-1505118380757-91f5f5632de0?auto=format&fit=crop&q=80&w=300&h=200" },
      { label: "Aromático", value: "aromatico", tag: "aromatico", image: "https://images.unsplash.com/photo-1596489379659-33d3ab2e76f5?auto=format&fit=crop&q=80&w=300&h=200" },
      { label: "Atalcado", value: "atalcado", tag: "atalcado", image: "https://images.unsplash.com/photo-1626074218678-75c13b355288?auto=format&fit=crop&q=80&w=300&h=200" },
      { label: "Especiado", value: "especiado", tag: "especiado", image: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&q=80&w=300&h=200" },
      { label: "Ambarado", value: "ambarado", tag: "ambarado", image: "https://images.unsplash.com/photo-1634153046045-3129fe24af27?auto=format&fit=crop&q=80&w=300&h=200" }
    ]
  },
  {
    id: "intensity",
    question: "Sobre a intensidade, qual você gosta mais?",
    options: [
      { label: "Leve e Discreto", value: "leve", tag: "leve", icon: Droplets, desc: "Para não incomodar, sensação de banho tomado" },
      { label: "Moderado", value: "moderado", tag: "moderado", icon: Sparkles, desc: "Na medida certa para o dia a dia" },
      { label: "Forte e Marcante", value: "forte", tag: "marcante", icon: Crown, desc: "Deixa rasto por onde passa" },
    ]
  },
  {
    id: "priority",
    question: "O que é mais importante para você?",
    options: [
      { label: "Performance", value: "performance", tag: "performance", icon: Zap, desc: "Duração alta na pele e forte projeção" },
      { label: "Custo Benefício", value: "custo_beneficio", tag: "custo-beneficio", icon: DollarSign, desc: "Um ótimo perfume sem gastar muito" },
      { label: "Exclusividade", value: "exclusividade", tag: "exclusivo", icon: Crown, desc: "Não quero ter o mesmo cheiro de todo mundo" }
    ]
  }
];

// Fallback mock
const mockPerfumes = [
  {
    id: "1",
    title: "Elegance Floral",
    image: "https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=400",
    price: "199.90",
    link: "#",
    tags: ["floral", "romantico", "leve"]
  },
  {
    id: "2",
    title: "Midnight Wood",
    image: "https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&q=80&w=400",
    price: "249.90",
    link: "#",
    tags: ["amadeirado", "festa", "marcante", "forte"]
  },
  {
    id: "3",
    title: "Summer Citrus",
    image: "https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?auto=format&fit=crop&q=80&w=400",
    price: "159.90",
    link: "#",
    tags: ["fresco", "dia-a-dia", "leve"]
  },
  {
    id: "4",
    title: "Sweet Vanilla Dream",
    image: "https://images.unsplash.com/photo-1595532542520-21db4b238382?auto=format&fit=crop&q=80&w=400",
    price: "189.90",
    link: "#",
    tags: ["adocicado", "festa", "moderado", "romantico"]
  },
  {
    id: "5",
     title: "Office Executive",
    image: "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&q=80&w=400",
    price: "179.90",
    link: "#",
    tags: ["amadeirado", "trabalho", "moderado"]
  },
  {
    id: "6",
    title: "Spring Breeze",
    image: "https://images.unsplash.com/photo-1616428612741-2a62852eb321?auto=format&fit=crop&q=80&w=400",
    price: "149.90",
    link: "#",
    tags: ["floral", "dia-a-dia", "leve"]
  }
];

export default function PerfumeQuiz() {
  const [currentStep, setCurrentStep] = useState(-1); // -1 is intro
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [perfumes, setPerfumes] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  
  const [shopifyConfig, setShopifyConfig] = useState({
    domain: "",
    token: ""
  });

  useEffect(() => {
    const fetchConfig = async () => {
      const docSnap = await getDoc(doc(db, "settings", "store"));
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.shopifyDomain) {
          setShopifyConfig({
            domain: data.shopifyDomain,
            token: data.shopifyAccessToken || ""
          });
        }
      }
    };
    fetchConfig();
  }, []);

  const handleStart = () => setCurrentStep(0);

  const handleSelect = (questionId: string, option: any) => {
    const question = quizQuestions[currentStep];

    if (question.multiple) {
      setAnswers(prev => {
        const currentAnswers = prev[questionId] || [];
        const exists = currentAnswers.find((a: any) => a.value === option.value);
        if (exists) {
          return { ...prev, [questionId]: currentAnswers.filter((a: any) => a.value !== option.value) };
        } else if (currentAnswers.length < question.multiple!) {
          return { ...prev, [questionId]: [...currentAnswers, option] };
        }
        return prev;
      });
    } else {
      setAnswers(prev => ({ ...prev, [questionId]: option }));
      
      if (currentStep < quizQuestions.length - 1) {
        setTimeout(() => {
          setCurrentStep(prev => prev + 1);
        }, 300);
      } else {
        finishQuiz({ ...answers, [questionId]: option });
      }
    }
  };

  const handleNextMultiple = () => {
    if (currentStep < quizQuestions.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      finishQuiz(answers);
    }
  };

  const finishQuiz = async (finalAnswers: any) => {
    setCurrentStep(quizQuestions.length);
    setLoading(true);

    try {
      let productsList: any[] = [];

      if (shopifyConfig.domain) {
        // Normalize domain just in case user pasted https://
        const cleanDomain = shopifyConfig.domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
        
        try {
          // Attempt using public products.json API first because it doesn't require auth
          // Using our own server proxy to bypass all CORS issues
          const targetUrl = `https://${cleanDomain}/products.json?limit=250`;
          let proxiedUrl = `/api/proxy?url=${encodeURIComponent(targetUrl)}`;
          
          let res = await fetch(proxiedUrl);
          
          if (res.ok) {
            const data = await res.json();
            if (data?.products) {
              productsList = data.products.map((p: any) => ({
                id: p.id,
                title: p.title,
                image: p.images && p.images.length > 0 ? p.images[0].src : null,
                price: p.variants && p.variants.length > 0 ? p.variants[0].price : 0,
                link: `https://${cleanDomain.split('/')[0]}/products/${p.handle}`,
                tags: p.tags ? (typeof p.tags === 'string' ? p.tags.split(',').map((t: string) => t.trim()) : p.tags) : [],
                fullText: (p.body_html || p.title || "").toLowerCase()
              }));
              console.log("Shopify public Fetch Result:", productsList.length, "products");
            }
          }
        } catch (e) {
          console.error("Error fetching public products.json", e);
        }

        // Fallback to WooCommerce if productsList is still empty
        if (productsList.length === 0) {
          try {
            const wcUrl = `https://${cleanDomain}/wp-json/wc/store/products?per_page=100`;
            let proxiedWcUrl = `/api/proxy?url=${encodeURIComponent(wcUrl)}`;
            let resWc = await fetch(proxiedWcUrl);

            if (resWc.ok) {
              const dataWc = await resWc.json();
              if (Array.isArray(dataWc)) {
                productsList = dataWc.map((p: any) => {
                  // extract tags from categories, plus description text
                  const catNames = p.categories ? p.categories.map((c:any) => c.name) : [];
                  const textForTags = (p.description + " " + p.short_description).toLowerCase();
                  
                  // Basic tags from categories
                  let tags = [...catNames];
                  
                  return {
                    id: p.id,
                    title: p.name,
                    image: p.images && p.images.length > 0 ? p.images[0].src : null,
                    price: p.prices && p.prices.price ? (parseInt(p.prices.price) / (10 ** p.prices.currency_minor_unit)) : 0,
                    link: p.permalink,
                    tags: tags,
                    fullText: textForTags // We text match here later since tags might be empty
                  };
                });
                console.log("WooCommerce Fetch Result:", productsList.length, "products");
              }
            }
          } catch (e) {
            console.error("Error fetching WooCommerce", e);
          }
        }

        // Fallback to GraphQL if productsList is still empty and token exists
        if (productsList.length === 0 && shopifyConfig.token) {
          const query = `
            {
              products(first: 250) {
                edges {
                  node {
                    id
                    title
                    tags
                    onlineStoreUrl
                    handle
                    descriptionHtml
                    images(first: 1) {
                      edges {
                        node {
                          url
                        }
                      }
                    }
                    priceRange {
                      minVariantPrice {
                        amount
                      }
                    }
                  }
                }
              }
            }
          `;
          
          try {
            const res = await fetch(`/api/proxy?url=${encodeURIComponent(`https://${cleanDomain.split('/')[0]}/api/2024-01/graphql.json`)}`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-Shopify-Storefront-Access-Token": shopifyConfig.token
              },
              body: JSON.stringify({ query })
            });
            
            const data = await res.json();
            console.log("Shopify GraphQL Fetch Result:", data); // Add for debugging
            if (data?.data?.products?.edges) {
              productsList = data.data.products.edges.map((e: any) => {
                const p = e.node;
                return {
                  id: p.id,
                  title: p.title,
                  image: p.images?.edges[0]?.node?.url,
                  price: p.priceRange?.minVariantPrice?.amount,
                  link: p.onlineStoreUrl || `https://${cleanDomain}/products/${p.handle}`,
                  tags: p.tags || [],
                  fullText: (p.descriptionHtml || p.title || "").toLowerCase()
                };
              });
            }
          } catch (e) {
            console.error("Error fetching via GraphQL", e);
          }
        }
      }

      if (productsList.length === 0) {
        console.log("No Shopify products found.");
      }

      // Recommend System based on tags
      const normalizeStr = (str: any) => String(str || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

      // Gather all tags selected
      const selectedTags = Object.values(finalAnswers)
        .flatMap((ans: any) => Array.isArray(ans) ? ans.map(a => a?.tag) : ans?.tag)
        .filter(Boolean)
        .map(t => normalizeStr(t as string));

      // Score products
      const scoredProducts = productsList.map(p => {
        let score = 0;
        const pTags = Array.isArray(p.tags) ? p.tags.map((t:any) => normalizeStr(t)) : [];
        const fullTextStr = p.fullText ? normalizeStr(p.fullText) : "";
        
        selectedTags.forEach(st => {
          if (
            pTags.some((pt:string) => pt.includes(st) || st.includes(pt)) ||
            fullTextStr.includes(st)
          ) {
            score++;
          }
        });
        return { ...p, score };
      });

      // Sort by score
      scoredProducts.sort((a, b) => b.score - a.score);
      
      // Get top 4-6
      // Optionally filter by score > 0 if you only want matches, but to avoid empty results we return top 6 anyway
      // since the site might not have perfectly tagged perfumes.
      const matchResults = scoredProducts.filter(p => p.score > 0);
      let results = matchResults.length > 0 ? matchResults.slice(0, 6) : scoredProducts.slice(0, 6);
      
      // Fallback if no matching products were found at all (API failed or list empty)
      if (results.length === 0) {
        results = mockPerfumes.slice(0, 6);
      }
      
      setPerfumes(results);

    } catch (err) {
      console.error(err);
      setPerfumes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRestart = () => {
    setAnswers({});
    setCurrentStep(-1);
    setPerfumes([]);
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center p-4">
      <div className={`w-full transition-all duration-500 ease-in-out ${currentStep >= 0 && quizQuestions[currentStep]?.imageCards ? 'max-w-5xl' : (currentStep === quizQuestions.length ? 'max-w-4xl' : 'max-w-2xl')}`}>
        <AnimatePresence mode="wait">
          {currentStep === -1 && (
            <motion.div 
              key="intro"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center w-full"
            >
              <div className="relative w-full h-64 md:h-80 mb-10 rounded-3xl overflow-hidden shadow-sm border border-neutral-100">
                <img 
                  src="https://img.freepik.com/fotos-premium/um-close-de-um-perfumista-em-sua-mesa-procurando-uma-nova-fragrancia-foto-premium_237404-1799.jpg" 
                  alt="Mesa de loja de perfumes com amostras e fitas olfativas" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-50/10 to-transparent"></div>
              </div>
              <h1 className="text-2xl md:text-3xl font-serif text-neutral-900 mb-3">Descubra sua Assinatura Olfativa</h1>
              <p className="text-sm md:text-base text-neutral-500 mb-8 max-w-md mx-auto leading-relaxed">
                Responda a algumas perguntas rápidas e nosso especialista virtual irá recomendar as melhores fragrâncias que combinam perfeitamente com você ou com o momento especial.
              </p>
              <Button onClick={handleStart} size="lg" className="rounded-full px-8 py-6 text-lg tracking-wide hover:scale-105 transition-transform">
                Começar o Quiz Olfativo <ChevronRight className="ml-2 w-5 h-5" />
              </Button>
            </motion.div>
          )}

          {currentStep >= 0 && currentStep < quizQuestions.length && (
            <motion.div 
              key={`q-${currentStep}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-3xl p-8 md:p-12 shadow-xl border border-neutral-100"
            >
              <div className="mb-8 md:mb-12">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                    Etapa {currentStep + 1} de {quizQuestions.length}
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-primary">
                    {Math.round(((currentStep + 1) / quizQuestions.length) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-neutral-100 h-2.5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${((currentStep + 1) / quizQuestions.length) * 100}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="bg-primary h-full rounded-full"
                  />
                </div>
              </div>

              <h2 className={`text-3xl md:text-4xl font-serif text-center mb-2 text-neutral-900 ${!quizQuestions[currentStep].subtitle && "mb-8"} `}>
                {quizQuestions[currentStep].question}
              </h2>
              {quizQuestions[currentStep].subtitle && (
                 <p className="text-center text-neutral-500 mb-8 max-w-xl mx-auto">{quizQuestions[currentStep].subtitle}</p>
              )}

              <div className={`grid gap-4 md:gap-6 ${quizQuestions[currentStep].gridCols || "grid-cols-1 md:grid-cols-2"}`}>
                {quizQuestions[currentStep].options.map((opt, i) => {
                  const isMultiple = quizQuestions[currentStep].multiple;
                  const isSelected = isMultiple 
                    ? (answers[quizQuestions[currentStep].id] || []).find((a:any) => a.value === opt.value)
                    : answers[quizQuestions[currentStep].id]?.value === opt.value;

                  const isImageCard = quizQuestions[currentStep].imageCards;

                  if (isImageCard) {
                    return (
                      <button
                        key={i}
                        onClick={() => handleSelect(quizQuestions[currentStep].id, opt)}
                        className={`relative overflow-hidden rounded-xl aspect-video group transition-all text-center flex items-center justify-center border-2 ${
                          isSelected 
                            ? 'border-primary shadow-lg scale-[1.02] z-10' 
                            : 'border-transparent shadow-sm hover:shadow-md hover:scale-[1.02]'
                        }`}
                      >
                         <img src={opt.image} alt={opt.label} className={`absolute inset-0 w-full h-full object-cover transition-transform duration-700 ${isSelected ? 'scale-105' : 'group-hover:scale-110'}`} />
                         {isSelected && <div className="absolute inset-0 bg-primary/10 transition-opacity" />}
                         <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors duration-500" />
                         <span className={`relative z-10 block px-3 py-1.5 bg-white text-neutral-900 text-xs md:text-sm font-bold rounded-full shadow-lg transition-transform ${isSelected ? 'scale-110 ring-2 ring-primary ring-offset-2' : 'group-hover:scale-105'}`}>
                           {opt.label}
                         </span>
                         {isSelected && (
                           <div className="absolute top-2 right-2 bg-primary text-white p-1 rounded-full shadow-md z-20">
                             <Check className="w-3 h-3 md:w-4 md:h-4" />
                           </div>
                         )}
                      </button>
                    )
                  }

                  return (
                    <button
                      key={i}
                      onClick={() => handleSelect(quizQuestions[currentStep].id, opt)}
                      className={`relative overflow-hidden p-5 md:p-6 rounded-2xl border-2 text-left transition-all group flex flex-col justify-center min-h-[100px] ${
                        isSelected 
                          ? 'border-primary bg-primary/5 shadow-md scale-[1.01]' 
                          : 'border-neutral-100 bg-white hover:border-primary/40 hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-center gap-4 w-full">
                        {opt.icon && (
                          <div className={`shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-colors ${isSelected ? 'bg-primary text-white' : 'bg-neutral-100 text-neutral-500 group-hover:bg-primary/20 group-hover:text-primary'}`}>
                            <opt.icon className="w-6 h-6" />
                          </div>
                        )}
                        <div className="flex-1">
                           <span className={`block text-base md:text-lg font-semibold tracking-tight transition-colors ${isSelected ? 'text-primary' : 'text-neutral-800 group-hover:text-primary'}`}>{opt.label}</span>
                           {opt.desc && (
                             <span className="block mt-1 text-sm text-neutral-500 leading-snug">{opt.desc}</span>
                           )}
                        </div>
                        {isMultiple ? (
                           <div className={`shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${isSelected ? 'border-primary bg-primary text-white' : 'border-neutral-300 group-hover:border-primary/50'}`}>
                              {isSelected && <Check className="w-4 h-4" />}
                           </div>
                        ) : (
                           <div className={`shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'border-primary bg-primary text-white' : 'border-neutral-300 group-hover:border-primary/50'}`}>
                              {isSelected && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
                           </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-10 flex flex-col-reverse sm:flex-row items-center justify-center gap-4">
                <Button 
                  variant="ghost" 
                  onClick={() => setCurrentStep(prev => prev - 1)}
                  className="text-neutral-500 hover:text-neutral-900 rounded-full px-6"
                >
                  <ArrowLeft className="mr-2 w-4 h-4" /> Voltar
                </Button>

                {quizQuestions[currentStep].multiple && (
                  <Button 
                    onClick={handleNextMultiple} 
                    size="lg" 
                    className="rounded-full px-8 py-6 text-lg tracking-wide hover:scale-105 transition-transform w-full sm:w-auto"
                    disabled={!(answers[quizQuestions[currentStep].id] && answers[quizQuestions[currentStep].id].length > 0)}
                  >
                    Continuar <ChevronRight className="ml-2 w-5 h-5" />
                  </Button>
                )}
              </div>
            </motion.div>
          )}

          {currentStep === quizQuestions.length && (
            <motion.div
              key="results"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full"
            >
              {loading ? (
                <div className="text-center py-20">
                  <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
                  <h3 className="text-2xl font-serif text-neutral-800">Analisando suas respostas...</h3>
                  <p className="text-neutral-500 mt-2">Buscando os perfumes ideais em nossa coleção.</p>
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="text-center mb-10">
                     <h2 className="text-3xl md:text-4xl font-serif text-neutral-900 mb-4">Suas Combinações Perfeitas</h2>
                     <p className="text-neutral-600">Baseado no seu perfil, separamos estas opções exclusivas para você.</p>
                  </div>
                  
                  {perfumes.length === 0 ? (
                    <div className="text-center py-10 bg-white rounded-3xl border border-neutral-100 shadow-sm">
                      <p className="text-neutral-500 mb-6 text-lg">Nenhum produto compatível encontrado na sua loja.</p>
                      <Button onClick={handleRestart} variant="outline" className="rounded-full">
                        Tentar Novamente
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {perfumes.map((perfume, i) => (
                        <motion.div
                           initial={{ opacity: 0, y: 20 }}
                           animate={{ opacity: 1, y: 0 }}
                           transition={{ delay: i * 0.1 }}
                           key={perfume.id} 
                           className="group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-neutral-100 flex flex-col"
                        >
                           <div className="aspect-square relative overflow-hidden bg-neutral-100">
                             {perfume.image ? (
                               <img src={perfume.image} alt={perfume.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                             ) : (
                               <div className="w-full h-full flex items-center justify-center text-neutral-400">Sem Imagem</div>
                             )}
                             {perfume.score > 0 && perfume.score === Math.max(...perfumes.map(p => p.score)) && (
                               <div className="absolute top-4 left-4 bg-primary text-white text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                                 Match #1
                               </div>
                             )}
                           </div>
                           <div className="p-6 flex flex-col flex-1">
                             <h3 className="text-lg font-semibold text-neutral-900 mb-2 truncate" title={perfume.title}>{perfume.title}</h3>
                             <div className="mt-auto">
                                <p className="text-xl font-light text-primary mb-4">
                                  R$ {Number(perfume.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </p>
                                <Button render={<a href={perfume.link} target="_blank" rel="noopener noreferrer" />} className="w-full rounded-xl" variant="default">
                                     Ver na Loja
                                </Button>
                             </div>
                           </div>
                        </motion.div>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row justify-center gap-4 mt-12 pt-8 border-t border-neutral-200">
                    <Button onClick={() => setCurrentStep(prev => prev - 1)} variant="outline" className="text-neutral-600 hover:text-neutral-900 border-neutral-200 hover:bg-neutral-100 bg-white">
                      <ArrowLeft className="mr-2 w-4 h-4" /> Alterar Respostas
                    </Button>
                    <Button onClick={handleRestart} variant="ghost" className="text-neutral-500 hover:text-neutral-900">
                      Refazer do Início
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
