import React, { useState, useEffect, useRef } from 'react';
import { Check, ArrowRight, RefreshCw, BookOpen, Trophy, AlertCircle, Sparkles, Globe, Loader2, Settings, Sliders, X, Filter, Search, Zap } from 'lucide-react';

// --- DATA & PATTERN GENERATION ---

// Helper to generate regular verb forms automatically
// Now accepts optional object context (e.g., "the car", "el coche")
const createRegularVerb = (english, spanish, obj = "", objSpa = "") => {
  // Strip "To " if present to ensure clean base
  const cleanEnglish = english.replace(/^To\s+/i, "").trim();
  const base = cleanEnglish.toLowerCase();
  
  let past = base + "ed";
  let pp = base + "ed";
  let ing = base + "ing";
  let s = base + "s";

  // Basic Heuristic Rules for Regular Verbs
  if (base.endsWith("e")) {
    past = base + "d";
    pp = base + "d";
    ing = base.slice(0, -1) + "ing";
  } else if (base.endsWith("y") && !['a','e','i','o','u'].includes(base[base.length - 2])) {
    past = base.slice(0, -1) + "ied";
    pp = base.slice(0, -1) + "ied";
    s = base.slice(0, -1) + "ies";
  } 
  
  return { inf: `To ${cleanEnglish}`, spa: spanish, base, past, pp, ing, s, obj, objSpa };
};

// 1. Irregular Verbs (Expanded with objects for transitive verbs)
const IRREGULAR_VERBS = [
  // Essentials & Common
  { inf: "To Be", spa: "Ser/Estar", base: "be", past: "was", pp: "been", ing: "being", s: "is" },
  { inf: "To Have", spa: "Tener", base: "have", past: "had", pp: "had", ing: "having", s: "has" },
  { inf: "To Do", spa: "Hacer", base: "do", past: "did", pp: "done", ing: "doing", s: "does", obj: "the work", objSpa: "el trabajo" },
  { inf: "To Say", spa: "Decir", base: "say", past: "said", pp: "said", ing: "saying", s: "says", obj: "hello", objSpa: "hola" },
  { inf: "To Go", spa: "Ir", base: "go", past: "went", pp: "gone", ing: "going", s: "goes" },
  { inf: "To Get", spa: "Obtener", base: "get", past: "got", pp: "gotten", ing: "getting", s: "gets", obj: "results", objSpa: "resultados" },
  { inf: "To Make", spa: "Hacer", base: "make", past: "made", pp: "made", ing: "making", s: "makes", obj: "a cake", objSpa: "un pastel" },
  { inf: "To Know", spa: "Saber", base: "know", past: "knew", pp: "known", ing: "knowing", s: "knows", obj: "the answer", objSpa: "la respuesta" },
  { inf: "To Think", spa: "Pensar", base: "think", past: "thought", pp: "thought", ing: "thinking", s: "thinks" },
  { inf: "To Take", spa: "Tomar", base: "take", past: "took", pp: "taken", ing: "taking", s: "takes", obj: "the bus", objSpa: "el autobús" },
  { inf: "To See", spa: "Ver", base: "see", past: "saw", pp: "seen", ing: "seeing", s: "sees", obj: "the bird", objSpa: "el pájaro" },
  { inf: "To Come", spa: "Venir", base: "come", past: "came", pp: "come", ing: "coming", s: "comes" },
  { inf: "To Want", spa: "Querer", base: "want", past: "wanted", pp: "wanted", ing: "wanting", s: "wants", obj: "pizza", objSpa: "pizza" },
  { inf: "To Use", spa: "Usar", base: "use", past: "used", pp: "used", ing: "using", s: "uses", obj: "the tool", objSpa: "la herramienta" },
  { inf: "To Find", spa: "Encontrar", base: "find", past: "found", pp: "found", ing: "finding", s: "finds", obj: "the keys", objSpa: "las llaves" },
  { inf: "To Give", spa: "Dar", base: "give", past: "gave", pp: "given", ing: "giving", s: "gives", obj: "a gift", objSpa: "un regalo" },
  { inf: "To Tell", spa: "Contar", base: "tell", past: "told", pp: "told", ing: "telling", s: "tells", obj: "a story", objSpa: "una historia" },
  { inf: "To Work", spa: "Trabajar", base: "work", past: "worked", pp: "worked", ing: "working", s: "works" },
  
  // A-Z Irregulars
  { inf: "To Become", spa: "Convertirse", base: "become", past: "became", pp: "become", ing: "becoming", s: "becomes" },
  { inf: "To Begin", spa: "Empezar", base: "begin", past: "began", pp: "begun", ing: "beginning", s: "begins" },
  { inf: "To Bite", spa: "Morder", base: "bite", past: "bit", pp: "bitten", ing: "biting", s: "bites", obj: "the apple", objSpa: "la manzana" },
  { inf: "To Blow", spa: "Soplar", base: "blow", past: "blew", pp: "blown", ing: "blowing", s: "blows", obj: "air", objSpa: "aire" },
  { inf: "To Break", spa: "Romper", base: "break", past: "broke", pp: "broken", ing: "breaking", s: "breaks", obj: "the glass", objSpa: "el vaso" },
  { inf: "To Bring", spa: "Traer", base: "bring", past: "brought", pp: "brought", ing: "bringing", s: "brings", obj: "water", objSpa: "agua" },
  { inf: "To Build", spa: "Construir", base: "build", past: "built", pp: "built", ing: "building", s: "builds", obj: "a house", objSpa: "una casa" },
  { inf: "To Buy", spa: "Comprar", base: "buy", past: "bought", pp: "bought", ing: "buying", s: "buys", obj: "food", objSpa: "comida" },
  { inf: "To Catch", spa: "Atrapar", base: "catch", past: "caught", pp: "caught", ing: "catching", s: "catches", obj: "the ball", objSpa: "la pelota" },
  { inf: "To Choose", spa: "Elegir", base: "choose", past: "chose", pp: "chosen", ing: "choosing", s: "chooses", obj: "a color", objSpa: "un color" },
  { inf: "To Cost", spa: "Costar", base: "cost", past: "cost", pp: "cost", ing: "costing", s: "costs", obj: "money", objSpa: "dinero" },
  { inf: "To Cut", spa: "Cortar", base: "cut", past: "cut", pp: "cut", ing: "cutting", s: "cuts", obj: "the paper", objSpa: "el papel" },
  { inf: "To Deal", spa: "Tratar", base: "deal", past: "dealt", pp: "dealt", ing: "dealing", s: "deals" },
  { inf: "To Dig", spa: "Cavar", base: "dig", past: "dug", pp: "dug", ing: "digging", s: "digs", obj: "a hole", objSpa: "un agujero" },
  { inf: "To Draw", spa: "Dibujar", base: "draw", past: "drew", pp: "drawn", ing: "drawing", s: "draws", obj: "a picture", objSpa: "un dibujo" },
  { inf: "To Drink", spa: "Beber", base: "drink", past: "drank", pp: "drunk", ing: "drinking", s: "drinks", obj: "water", objSpa: "agua" },
  { inf: "To Drive", spa: "Conducir", base: "drive", past: "drove", pp: "driven", ing: "driving", s: "drives", obj: "the car", objSpa: "el coche" },
  { inf: "To Eat", spa: "Comer", base: "eat", past: "ate", pp: "eaten", ing: "eating", s: "eats", obj: "lunch", objSpa: "el almuerzo" },
  { inf: "To Fall", spa: "Caer", base: "fall", past: "fell", pp: "fallen", ing: "falling", s: "falls" },
  { inf: "To Feed", spa: "Alimentar", base: "feed", past: "fed", pp: "fed", ing: "feeding", s: "feeds", obj: "the dog", objSpa: "al perro" },
  { inf: "To Feel", spa: "Sentir", base: "feel", past: "felt", pp: "felt", ing: "feeling", s: "feels", obj: "happy", objSpa: "feliz" },
  { inf: "To Fight", spa: "Pelear", base: "fight", past: "fought", pp: "fought", ing: "fighting", s: "fights" },
  { inf: "To Fly", spa: "Volar", base: "fly", past: "flew", pp: "flown", ing: "flying", s: "flies" },
  { inf: "To Forget", spa: "Olvidar", base: "forget", past: "forgot", pp: "forgotten", ing: "forgetting", s: "forgets", obj: "the name", objSpa: "el nombre" },
  { inf: "To Forgive", spa: "Perdonar", base: "forgive", past: "forgave", pp: "forgiven", ing: "forgiving", s: "forgives", obj: "him", objSpa: "a él" },
  { inf: "To Freeze", spa: "Congelar", base: "freeze", past: "froze", pp: "frozen", ing: "freezing", s: "freezes", obj: "the water", objSpa: "el agua" },
  { inf: "To Grow", spa: "Crecer", base: "grow", past: "grew", pp: "grown", ing: "growing", s: "grows" },
  { inf: "To Hang", spa: "Colgar", base: "hang", past: "hung", pp: "hung", ing: "hanging", s: "hangs", obj: "the coat", objSpa: "el abrigo" },
  { inf: "To Hear", spa: "Oír", base: "hear", past: "heard", pp: "heard", ing: "hearing", s: "hears", obj: "a noise", objSpa: "un ruido" },
  { inf: "To Hide", spa: "Esconder", base: "hide", past: "hid", pp: "hidden", ing: "hiding", s: "hides", obj: "the box", objSpa: "la caja" },
  { inf: "To Hit", spa: "Golpear", base: "hit", past: "hit", pp: "hit", ing: "hitting", s: "hits", obj: "the ball", objSpa: "la pelota" },
  { inf: "To Hold", spa: "Sostener", base: "hold", past: "held", pp: "held", ing: "holding", s: "holds", obj: "the hand", objSpa: "la mano" },
  { inf: "To Hurt", spa: "Herir", base: "hurt", past: "hurt", pp: "hurt", ing: "hurting", s: "hurts" },
  { inf: "To Keep", spa: "Mantener", base: "keep", past: "kept", pp: "kept", ing: "keeping", s: "keeps", obj: "the secret", objSpa: "el secreto" },
  { inf: "To Lay", spa: "Poner", base: "lay", past: "laid", pp: "laid", ing: "laying", s: "lays", obj: "the book", objSpa: "el libro" },
  { inf: "To Lead", spa: "Liderar", base: "lead", past: "led", pp: "led", ing: "leading", s: "leads", obj: "the team", objSpa: "el equipo" },
  { inf: "To Leave", spa: "Dejar", base: "leave", past: "left", pp: "left", ing: "leaving", s: "leaves", obj: "the room", objSpa: "la habitación" },
  { inf: "To Lend", spa: "Prestar", base: "lend", past: "lent", pp: "lent", ing: "lending", s: "lends", obj: "money", objSpa: "dinero" },
  { inf: "To Let", spa: "Dejar", base: "let", past: "let", pp: "let", ing: "letting", s: "lets", obj: "it go", objSpa: "ir" },
  { inf: "To Lie", spa: "Mentir/Yacer", base: "lie", past: "lay", pp: "lain", ing: "lying", s: "lies" }, 
  { inf: "To Light", spa: "Encender", base: "light", past: "lit", pp: "lit", ing: "lighting", s: "lights", obj: "the fire", objSpa: "el fuego" },
  { inf: "To Lose", spa: "Perder", base: "lose", past: "lost", pp: "lost", ing: "losing", s: "loses", obj: "the game", objSpa: "el juego" },
  { inf: "To Mean", spa: "Significar", base: "mean", past: "meant", pp: "meant", ing: "meaning", s: "means", obj: "that", objSpa: "eso" },
  { inf: "To Meet", spa: "Conocer", base: "meet", past: "met", pp: "met", ing: "meeting", s: "meets", obj: "friends", objSpa: "amigos" },
  { inf: "To Pay", spa: "Pagar", base: "pay", past: "paid", pp: "paid", ing: "paying", s: "pays", obj: "the bill", objSpa: "la cuenta" },
  { inf: "To Put", spa: "Poner", base: "put", past: "put", pp: "put", ing: "putting", s: "puts", obj: "it there", objSpa: "lo allí" },
  { inf: "To Quit", spa: "Renunciar", base: "quit", past: "quit", pp: "quit", ing: "quitting", s: "quits", obj: "the job", objSpa: "el trabajo" },
  { inf: "To Read", spa: "Leer", base: "read", past: "read", pp: "read", ing: "reading", s: "reads", obj: "a book", objSpa: "un libro" },
  { inf: "To Ride", spa: "Montar", base: "ride", past: "rode", pp: "ridden", ing: "riding", s: "rides", obj: "a bike", objSpa: "una bici" },
  { inf: "To Ring", spa: "Sonar", base: "ring", past: "rang", pp: "rung", ing: "ringing", s: "rings", obj: "the bell", objSpa: "la campana" },
  { inf: "To Rise", spa: "Subir", base: "rise", past: "rose", pp: "risen", ing: "rising", s: "rises" },
  { inf: "To Run", spa: "Correr", base: "run", past: "ran", pp: "run", ing: "running", s: "runs" },
  { inf: "To Sell", spa: "Vender", base: "sell", past: "sold", pp: "sold", ing: "selling", s: "sells", obj: "fruit", objSpa: "fruta" },
  { inf: "To Send", spa: "Enviar", base: "send", past: "sent", pp: "sent", ing: "sending", s: "sends", obj: "a letter", objSpa: "una carta" },
  { inf: "To Set", spa: "Fijar", base: "set", past: "set", pp: "set", ing: "setting", s: "sets", obj: "the table", objSpa: "la mesa" },
  { inf: "To Shake", spa: "Sacudir", base: "shake", past: "shook", pp: "shaken", ing: "shaking", s: "shakes", obj: "hands", objSpa: "manos" },
  { inf: "To Shine", spa: "Brillar", base: "shine", past: "shone", pp: "shone", ing: "shining", s: "shines" },
  { inf: "To Shoot", spa: "Disparar", base: "shoot", past: "shot", pp: "shot", ing: "shooting", s: "shoots" },
  { inf: "To Show", spa: "Mostrar", base: "show", past: "showed", pp: "shown", ing: "showing", s: "shows", obj: "the map", objSpa: "el mapa" },
  { inf: "To Shut", spa: "Cerrar", base: "shut", past: "shut", pp: "shut", ing: "shutting", s: "shuts", obj: "the door", objSpa: "la puerta" },
  { inf: "To Sing", spa: "Cantar", base: "sing", past: "sang", pp: "sung", ing: "singing", s: "sings", obj: "a song", objSpa: "una canción" },
  { inf: "To Sink", spa: "Hundir", base: "sink", past: "sank", pp: "sunk", ing: "sinking", s: "sinks" },
  { inf: "To Sit", spa: "Sentarse", base: "sit", past: "sat", pp: "sat", ing: "sitting", s: "sits" },
  { inf: "To Sleep", spa: "Dormir", base: "sleep", past: "slept", pp: "slept", ing: "sleeping", s: "sleeps" },
  { inf: "To Slide", spa: "Deslizar", base: "slide", past: "slid", pp: "slid", ing: "sliding", s: "slides" },
  { inf: "To Speak", spa: "Hablar", base: "speak", past: "spoke", pp: "spoken", ing: "speaking", s: "speaks" },
  { inf: "To Spend", spa: "Gastar", base: "spend", past: "spent", pp: "spent", ing: "spending", s: "spends", obj: "money", objSpa: "dinero" },
  { inf: "To Spin", spa: "Girar", base: "spin", past: "spun", pp: "spun", ing: "spinning", s: "spins" },
  { inf: "To Spread", spa: "Esparcir", base: "spread", past: "spread", pp: "spread", ing: "spreading", s: "spreads" },
  { inf: "To Stand", spa: "Estar de pie", base: "stand", past: "stood", pp: "stood", ing: "standing", s: "stands" },
  { inf: "To Steal", spa: "Robar", base: "steal", past: "stole", pp: "stolen", ing: "stealing", s: "steals" },
  { inf: "To Stick", spa: "Pegar", base: "stick", past: "stuck", pp: "stuck", ing: "sticking", s: "sticks" },
  { inf: "To Strike", spa: "Golpear", base: "strike", past: "struck", pp: "struck", ing: "striking", s: "strikes" },
  { inf: "To Swear", spa: "Jurar", base: "swear", past: "swore", pp: "sworn", ing: "swearing", s: "swears" },
  { inf: "To Sweep", spa: "Barrer", base: "sweep", past: "swept", pp: "swept", ing: "sweeping", s: "sweeps", obj: "the floor", objSpa: "el suelo" },
  { inf: "To Swim", spa: "Nadar", base: "swim", past: "swam", pp: "swum", ing: "swimming", s: "swims" },
  { inf: "To Swing", spa: "Balancear", base: "swing", past: "swung", pp: "swung", ing: "swinging", s: "swings" },
  { inf: "To Teach", spa: "Enseñar", base: "teach", past: "taught", pp: "taught", ing: "teaching", s: "teaches", obj: "math", objSpa: "matemáticas" },
  { inf: "To Tear", spa: "Rasgar", base: "tear", past: "tore", pp: "torn", ing: "tearing", s: "tears", obj: "the paper", objSpa: "el papel" },
  { inf: "To Throw", spa: "Lanzar", base: "throw", past: "threw", pp: "thrown", ing: "throwing", s: "throws", obj: "the ball", objSpa: "la pelota" },
  { inf: "To Understand", spa: "Entender", base: "understand", past: "understood", pp: "understood", ing: "understanding", s: "understands" },
  { inf: "To Wake", spa: "Despertar", base: "wake", past: "woke", pp: "woken", ing: "waking", s: "wakes" },
  { inf: "To Wear", spa: "Llevar puesto", base: "wear", past: "wore", pp: "worn", ing: "wearing", s: "wears", obj: "a hat", objSpa: "un sombrero" },
  { inf: "To Weep", spa: "Llorar", base: "weep", past: "wept", pp: "wept", ing: "weeping", s: "weeps" },
  { inf: "To Win", spa: "Ganar", base: "win", past: "won", pp: "won", ing: "winning", s: "wins", obj: "the race", objSpa: "la carrera" },
  { inf: "To Write", spa: "Escribir", base: "write", past: "wrote", pp: "written", ing: "writing", s: "writes", obj: "a book", objSpa: "un libro" }
];

// 2. Regular Verb List (English, Spanish)
// Added contexts to common transitive regular verbs
const REGULAR_LIST = [
  ["Accept", "Aceptar", "the offer", "la oferta"], ["Achieve", "Lograr", "goals", "metas"], ["Act", "Actuar"], 
  ["Add", "Añadir", "sugar", "azúcar"], ["Admire", "Admirar"], ["Admit", "Admitir"], ["Adopt", "Adoptar"], 
  ["Advise", "Aconsejar"], ["Announce", "Anunciar", "the news", "las noticias"], ["Apologize", "Disculparse"], 
  ["Appear", "Aparecer"], ["Apply", "Aplicar"], ["Argue", "Discutir"], ["Arrange", "Organizar"], ["Arrive", "Llegar"], 
  ["Attach", "Adjuntar"], ["Attack", "Atacar"], ["Attempt", "Intentar"], ["Attend", "Asistir"], ["Attract", "Atraer"], 
  ["Avoid", "Evitar"], ["Bake", "Hornear", "bread", "pan"], ["Balance", "Equilibrar"], ["Ban", "Prohibir"], 
  ["Battle", "Batallar"], ["Beg", "Rogar"], ["Behave", "Comportarse"], ["Belong", "Pertenecer"], ["Benefit", "Beneficiar"], 
  ["Blame", "Culpar"], ["Bless", "Bendecir"], ["Blind", "Cegar"], ["Blink", "Parpadear"], ["Block", "Bloquear"], 
  ["Boil", "Hervir"], ["Book", "Reservar"], ["Borrow", "Pedir prestado"], ["Bother", "Molestar"], ["Bounce", "Rebotar"], 
  ["Brake", "Frenar"], ["Breathe", "Respirar"], ["Brush", "Cepillar"], ["Burn", "Quemar"], ["Bury", "Enterrar"], 
  ["Calculate", "Calcular"], ["Camp", "Acampar"], ["Cancel", "Cancelar"], ["Care", "Cuidar"], ["Carry", "Llevar", "a bag", "una bolsa"], 
  ["Cause", "Causar"], ["Celebrate", "Celebrar"], ["Challenge", "Desafiar"], ["Charge", "Cargar/Cobrar"], ["Chase", "Perseguir"], 
  ["Chat", "Charlar"], ["Cheat", "Hacer trampa"], ["Check", "Verificar"], ["Cheer", "Animar"], ["Chew", "Masticar"], 
  ["Choke", "Ahogarse"], ["Chop", "Picar"], ["Claim", "Reclamar"], ["Clap", "Aplaudir"], ["Clear", "Despejar"], 
  ["Climb", "Escalar"], ["Coach", "Entrenar"], ["Collect", "Coleccionar"], ["Color", "Colorear"], ["Comb", "Peinar"], 
  ["Combine", "Combinar"], ["Comfort", "Consolar"], ["Command", "Mandar"], ["Compare", "Comparar"], ["Compete", "Competir"], 
  ["Complain", "Quejarse"], ["Complete", "Completar"], ["Concentrate", "Concentrarse"], ["Concern", "Preocupar"], ["Confess", "Confesar"], 
  ["Confirm", "Confirmar"], ["Confuse", "Confundir"], ["Connect", "Conectar"], ["Consider", "Considerar"], ["Consist", "Consistir"], 
  ["Contain", "Contener"], ["Copy", "Copiar"], ["Correct", "Corregir"], ["Cough", "Toser"], ["Count", "Contar"], 
  ["Cover", "Cubrir"], ["Crack", "Agrietar"], ["Crash", "Chocar"], ["Crawl", "Gatear"], ["Cross", "Cruzar"], 
  ["Crush", "Aplastar"], ["Cry", "Llorar"], ["Cure", "Curar"], ["Cycle", "Andar en bici"], ["Damage", "Dañar"], 
  ["Dare", "Atreverse"], ["Debate", "Debatir"], ["Decorate", "Decorar"], ["Defend", "Defender"], ["Delay", "Retrasar"], 
  ["Deliver", "Entregar"], ["Demand", "Exigir"], ["Deny", "Negar"], ["Depend", "Depender"], ["Describe", "Describir"], 
  ["Deserve", "Merecer"], ["Destroy", "Destruir"], ["Detect", "Detectar"], ["Develop", "Desarrollar"], ["Disagree", "Desacordar"], 
  ["Disappear", "Desaparecer"], ["Discover", "Descubrir"], ["Dislike", "Disgustar"], ["Divide", "Dividir"], ["Double", "Duplicar"], 
  ["Doubt", "Dudar"], ["Drag", "Arrastrar"], ["Dream", "Soñar"], ["Dress", "Vestirse"], ["Drop", "Dejar caer"], 
  ["Drown", "Ahogarse"], ["Dry", "Secar"], ["Earn", "Ganar (dinero)"], ["Educate", "Educar"], ["Employ", "Emplear"], 
  ["Empty", "Vaciar"], ["Encourage", "Animar"], ["End", "Terminar"], ["Enter", "Entrar"], ["Entertain", "Entretener"], 
  ["Escape", "Escapar"], ["Examine", "Examinar"], ["Excite", "Emocionar"], ["Excuse", "Excusar"], ["Exercise", "Ejercitar"], 
  ["Exist", "Existir"], ["Expand", "Expandir"], ["Expect", "Esperar"], ["Explode", "Explotar"], ["Explore", "Explorar"], 
  ["Extend", "Extender"], ["Face", "Enfrentar"], ["Fade", "Desvanecer"], ["Fail", "Fallar"], ["Fancy", "Imaginar/Gustar"], 
  ["Fasten", "Abrochar"], ["Fear", "Temer"], ["Fetch", "Ir a buscar"], ["File", "Archivar"], ["Fill", "Llenar"], 
  ["Film", "Filmar"], ["Finish", "Terminar"], ["Fire", "Despedir/Disparar"], ["Fit", "Encajar"], ["Fix", "Arreglar"], 
  ["Flash", "Brillar"], ["Float", "Flotar"], ["Flood", "Inundar"], ["Flow", "Fluir"], ["Fold", "Doblar"], 
  ["Force", "Forzar"], ["Form", "Formar"], ["Found", "Fundar"], ["Frame", "Enmarcar"], ["Frighten", "Asustar"], 
  ["Fry", "Freír"], ["Gather", "Reunir"], ["Gaze", "Mirar fijamente"], ["Glue", "Pegar"], ["Grab", "Agarrar"], 
  ["Greet", "Saludar"], ["Grin", "Sonreír"], ["Grip", "Agarrar"], ["Groan", "Gemir"], ["Guard", "Proteger"], 
  ["Guess", "Adivinar"], ["Guide", "Guiar"], ["Hammer", "Martillar"], ["Hand", "Entregar"], ["Handle", "Manejar"], 
  ["Harm", "Dañar"], ["Hate", "Odiar"], ["Heal", "Curar"], ["Heat", "Calentar"], ["Hesitate", "Dudar"], 
  ["Hide", "Esconder"], ["Hire", "Contratar"], ["Hug", "Abrazar"], ["Hunt", "Cazar"], ["Hurry", "Apurarse"], 
  ["Identify", "Identificar"], ["Ignore", "Ignorar"], ["Imagine", "Imaginar"], ["Impress", "Impresionar"], ["Improve", "Mejorar"], 
  ["Increase", "Aumentar"], ["Influence", "Influenciar"], ["Inform", "Informar"], ["Inject", "Inyectar"], ["Injure", "Herir"], 
  ["Insert", "Insertar"], ["Insist", "Insistir"], ["Inspect", "Inspeccionar"], ["Inspire", "Inspirar"], ["Install", "Instalar"], 
  ["Instruct", "Instruir"], ["Intend", "Intentar"], ["Interest", "Interesar"], ["Interfere", "Interferir"], ["Interrupt", "Interrumpir"], 
  ["Introduce", "Presentar"], ["Invent", "Inventar"], ["Invite", "Invitar"], ["Irritate", "Irritar"], ["Itch", "Picar"], 
  ["Jog", "Trotar"], ["Join", "Unirse"], ["Joke", "Bromear"], ["Judge", "Juzgar"], ["Kick", "Patear", "the ball", "la pelota"], 
  ["Kiss", "Besar"], ["Knock", "Tocar/Golpear"], ["Label", "Etiquetar"], ["Land", "Aterrizar"], ["Last", "Durar"], 
  ["Laugh", "Reír"], ["Launch", "Lanzar"], ["Lick", "Lamer"], ["List", "Listar"], ["Load", "Cargar"], ["Lock", "Cerrar con llave"], ["Manage", "Administrar"], ["March", "Marchar"], 
  ["Mark", "Marcar"], ["Marry", "Casarse"], ["Match", "Emparejar"], ["Measure", "Medir"], ["Melt", "Derretir"], 
  ["Memorize", "Memorizar"], ["Mend", "Remendar"], ["Mention", "Mencionar"], ["Mess", "Desordenar"], ["Miss", "Extrañar/Perder"], 
  ["Mix", "Mezclar"], ["Moan", "Gemir"], ["Multiply", "Multiplicar"], ["Murder", "Asesinar"], ["Nail", "Clavar"], 
  ["Name", "Nombrar"], ["Note", "Notar"], ["Notice", "Notar"], ["Number", "Numerar"], ["Obey", "Obedecer"], 
  ["Object", "Objetar"], ["Observe", "Observar"], ["Obtain", "Obtener"], ["Occur", "Ocurrir"], ["Offend", "Ofender"], 
  ["Order", "Ordenar"], ["Organize", "Organizar"], ["Owe", "Deber"], ["Own", "Poseer"], ["Pack", "Empacar"], 
  ["Paint", "Pintar", "a picture", "un cuadro"], ["Park", "Estacionar"], ["Pause", "Pausar"], ["Perform", "Actuar/Realizar"], ["Permit", "Permitir"], 
  ["Phone", "Llamar"], ["Pick", "Escoger"], ["Place", "Colocar"], ["Plan", "Planear"], ["Please", "Complacer"], 
  ["Plug", "Enchufar"], ["Point", "Apuntar"], ["Polish", "Pulir"], ["Possess", "Poseer"], ["Post", "Publicar"], 
  ["Pour", "Verter"], ["Practice", "Practicar"], ["Pray", "Rezar"], ["Prefer", "Preferir"], ["Prepare", "Preparar"], 
  ["Present", "Presentar"], ["Press", "Presionar"], ["Pretend", "Fingir"], ["Prevent", "Prevenir"], ["Print", "Imprimir"], 
  ["Produce", "Producir"], ["Program", "Programar"], ["Promise", "Prometer"], ["Protect", "Proteger"], ["Pump", "Bombear"], 
  ["Punch", "Golpear"], ["Punish", "Castigar"], ["Question", "Cuestionar"], ["Race", "Correr"], ["Rain", "Llover"], 
  ["Realize", "Darse cuenta"], ["Receive", "Recibir"], ["Recognize", "Reconocer"], ["Record", "Grabar"], ["Refuse", "Rehusar"], 
  ["Regret", "Lamentar"], ["Reject", "Rechazar"], ["Relax", "Relajar"], ["Release", "Liberar"], ["Rely", "Confiar"], 
  ["Remind", "Recordar (a alguien)"], ["Remove", "Remover"], ["Repair", "Reparar"], ["Repeat", "Repetir"], ["Replace", "Reemplazar"], 
  ["Reply", "Responder"], ["Reproduce", "Reproducir"], ["Request", "Solicitar"], ["Rescue", "Rescatar"], ["Retire", "Retirarse"], 
  ["Return", "Regresar"], ["Review", "Revisar"], ["Rhyme", "Rimar"], ["Risk", "Arriesgar"], ["Roll", "Rodar"], 
  ["Rub", "Frotar"], ["Ruin", "Arruinar"], ["Rule", "Gobernar"], ["Rush", "Apurarse"], ["Sack", "Despedir"], 
  ["Sail", "Navegar"], ["Satisfy", "Satisfacer"], ["Save", "Salvar/Guardar"], ["Scare", "Asustar"], ["Scatter", "Esparcir"], 
  ["Scold", "Regañar"], ["Scratch", "Rasguñar"], ["Scream", "Gritar"], ["Screw", "Atornillar"], ["Search", "Buscar"], 
  ["Select", "Seleccionar"], ["Separate", "Separar"], ["Serve", "Servir"], ["Share", "Compartir"], ["Shave", "Afeitarse"], 
  ["Shock", "Impactar"], ["Shop", "Comprar"], ["Shout", "Gritar"], ["Sign", "Firmar"], ["Signal", "Señalizar"], 
  ["Silence", "Silenciar"], ["Ski", "Esquiar"], ["Skip", "Saltar/Omitir"], ["Slap", "Abofetear"], ["Slip", "Resbalar"], 
  ["Slow", "Desacelerar"], ["Smash", "Destrozar"], ["Smell", "Oler"], ["Smile", "Sonreír"], ["Smoke", "Fumar"], 
  ["Sneeze", "Estornudar"], ["Snore", "Roncar"], ["Snow", "Nevar"], ["Soak", "Empapar"], ["Solve", "Resolver"], 
  ["Sound", "Sonar"], ["Spare", "Ahorrar"], ["Spark", "Chispear"], ["Spell", "Deletrear"], ["Spill", "Derramar"], 
  ["Spoil", "Arruinar/Mimar"], ["Spot", "Localizar"], ["Spray", "Rociar"], ["Stare", "Mirar fijamente"], ["Step", "Pisar"], 
  ["Store", "Almacenar"], ["Stretch", "Estirar"], ["Stroke", "Acariciar"], ["Succeed", "Tener éxito"], ["Suffer", "Sufrir"], 
  ["Supply", "Suministrar"], ["Support", "Apoyar"], ["Suppose", "Suponer"], ["Surprise", "Sorprender"], ["Surround", "Rodear"], 
  ["Suspect", "Sospechar"], ["Suspend", "Suspender"], ["Swallow", "Tragar"], ["Tap", "Golpear suavemente"], ["Taste", "Probar/Saber"], 
  ["Tease", "Burlarse"], ["Telephone", "Telefonear"], ["Tempt", "Tentar"], ["Terrify", "Aterrorizar"], ["Test", "Probar"], 
  ["Thaw", "Descongelar"], ["Tick", "Marcar"], ["Tickle", "Hacer cosquillas"], ["Tie", "Atar"], ["Time", "Cronometrar"], 
  ["Tip", "Dar propina"], ["Tour", "Recorrer"], ["Tow", "Remolcar"], ["Trace", "Rastrear"], ["Trade", "Comerciar"], 
  ["Train", "Entrenar"], ["Transport", "Transportar"], ["Trap", "Atrapar"], ["Treat", "Tratar"], ["Tremble", "Temblar"], 
  ["Trick", "Engañar"], ["Trip", "Tropezar"], ["Trots", "Trotar"], ["Trouble", "Preocupar"], ["Trust", "Confiar"], 
  ["Twist", "Torcer"], ["Type", "Escribir (teclado)"], ["Unite", "Unir"], ["Unlock", "Desbloquear"], ["Unpack", "Desempacar"], 
  ["Vanish", "Desvanecer"], ["Visit", "Visitar"], ["Wander", "Vagar"], ["Warm", "Calentar"], ["Warn", "Advertir"], 
  ["Waste", "Desperdiciar"], ["Water", "Regar"], ["Wave", "Saludar (mano)"], ["Weigh", "Pesar"], ["Welcome", "Dar la bienvenida"], 
  ["Whisper", "Susurrar"], ["Whistle", "Silbar"], ["Wipe", "Limpiar"], ["Wish", "Desear"], ["Wonder", "Preguntarse"], 
  ["Wrap", "Envolver"], ["Wreck", "Destrozar"], ["Yawn", "Bostezar"], ["Yell", "Gritar"], ["Zip", "Cerrar cremallera"], 
  ["Zoom", "Acercar"]
];

// Combine Irregular and Regular verbs into one master list, filtering out Regular entries that exist in Irregular list
const FULL_VERB_LIST = [
  ...IRREGULAR_VERBS,
  ...REGULAR_LIST
    .filter(([english]) => !IRREGULAR_VERBS.some(iv => iv.inf === `To ${english}` || iv.base === english.toLowerCase()))
    .map(([english, spanish, obj = "", objSpa = ""]) => createRegularVerb(english, spanish, obj, objSpa))
].sort((a, b) => a.inf.localeCompare(b.inf));

// 2. Generate the 12 Tense Patterns for each verb
const generatePatterns = () => {
  const patterns = [];

  FULL_VERB_LIST.forEach(v => {
    const { inf, spa, base, past, pp, ing, s } = v;

    // --- 1. PRESENT TENSES ---
    // Simple Present (I work / He works)
    if (inf !== "To Be") {
        patterns.push({ term: base, verb: inf, spanishVerb: spa, tense: "Present Simple" });
        patterns.push({ term: s, verb: inf, spanishVerb: spa, tense: "Present Simple" });
    } else {
        patterns.push({ term: "am", verb: inf, spanishVerb: spa, tense: "Present Simple" });
        patterns.push({ term: "is", verb: inf, spanishVerb: spa, tense: "Present Simple" });
        patterns.push({ term: "are", verb: inf, spanishVerb: spa, tense: "Present Simple" });
    }

    // Present Continuous (am/is/are + ing)
    patterns.push({ term: `am ${ing}`, verb: inf, spanishVerb: spa, tense: "Present Continuous" });
    patterns.push({ term: `is ${ing}`, verb: inf, spanishVerb: spa, tense: "Present Continuous" });
    patterns.push({ term: `are ${ing}`, verb: inf, spanishVerb: spa, tense: "Present Continuous" });

    // Present Perfect (have/has + pp)
    patterns.push({ term: `have ${pp}`, verb: inf, spanishVerb: spa, tense: "Present Perfect" });
    patterns.push({ term: `has ${pp}`, verb: inf, spanishVerb: spa, tense: "Present Perfect" });

    // Present Perfect Continuous (have/has been + ing)
    patterns.push({ term: `have been ${ing}`, verb: inf, spanishVerb: spa, tense: "Present Perfect Continuous" });
    patterns.push({ term: `has been ${ing}`, verb: inf, spanishVerb: spa, tense: "Present Perfect Continuous" });


    // --- 2. PAST TENSES ---
    // Simple Past
    if (inf !== "To Be") {
        patterns.push({ term: past, verb: inf, spanishVerb: spa, tense: "Past Simple" });
    } else {
        patterns.push({ term: "was", verb: inf, spanishVerb: spa, tense: "Past Simple" });
        patterns.push({ term: "were", verb: inf, spanishVerb: spa, tense: "Past Simple" });
    }

    // Past Continuous (was/were + ing)
    patterns.push({ term: `was ${ing}`, verb: inf, spanishVerb: spa, tense: "Past Continuous" });
    patterns.push({ term: `were ${ing}`, verb: inf, spanishVerb: spa, tense: "Past Continuous" });

    // Past Perfect (had + pp)
    patterns.push({ term: `had ${pp}`, verb: inf, spanishVerb: spa, tense: "Past Perfect" });

    // Past Perfect Continuous (had been + ing)
    patterns.push({ term: `had been ${ing}`, verb: inf, spanishVerb: spa, tense: "Past Perfect Continuous" });


    // --- 3. FUTURE TENSES ---
    // Simple Future (will + base)
    patterns.push({ term: `will ${base}`, verb: inf, spanishVerb: spa, tense: "Future Simple" });

    // Future Continuous (will be + ing)
    patterns.push({ term: `will be ${ing}`, verb: inf, spanishVerb: spa, tense: "Future Continuous" });

    // Future Perfect (will have + pp)
    patterns.push({ term: `will have ${pp}`, verb: inf, spanishVerb: spa, tense: "Future Perfect" });

    // Future Perfect Continuous (will have been + ing)
    patterns.push({ term: `will have been ${ing}`, verb: inf, spanishVerb: spa, tense: "Future Perfect Continuous" });

  });

  return patterns;
};

// Execute generation
const SEARCH_PATTERNS = generatePatterns();

// Derive unique options for settings
const ALL_TENSES = [...new Set(SEARCH_PATTERNS.map(p => p.tense))].sort();
const ALL_VERBS = [...new Set(SEARCH_PATTERNS.map(p => p.verb))].sort();

// --- FALLBACK SENTENCE GENERATOR ---
const SENTENCE_TEMPLATES = {
  "Present Simple": [
    { eng: "I {base} {obj} every single day.", spa: "Yo {spa} {objSpa} cada día.", ans: "{base}" },
    { eng: "She {s} {obj} very well.", spa: "Ella {spa} {objSpa} muy bien.", ans: "{s}" },
    { eng: "They {base} {obj} on weekends.", spa: "Ellos {spa} {objSpa} los fines de semana.", ans: "{base}" },
    { eng: "We {base} {obj} together.", spa: "Nosotros {spa} {objSpa} juntos.", ans: "{base}" },
    { eng: "He always {s} {obj} before breakfast.", spa: "Él siempre {spa} {objSpa} antes del desayuno.", ans: "{s}" },
    { eng: "You {base} {obj} so much.", spa: "Tú {spa} {objSpa} tanto.", ans: "{base}" }
  ],
  "Present Continuous": [
    { eng: "I am {ing} {obj} right now.", spa: "Estoy {ingSpa} {objSpa} ahora mismo.", ans: "am {ing}" },
    { eng: "She is {ing} {obj} today.", spa: "Ella está {ingSpa} {objSpa} hoy.", ans: "is {ing}" },
    { eng: "We are {ing} {obj} today.", spa: "Estamos {ingSpa} {objSpa} hoy.", ans: "are {ing}" },
    { eng: "They are {ing} {obj} outside.", spa: "Ellos están {ingSpa} {objSpa} afuera.", ans: "are {ing}" },
    { eng: "He is {ing} {obj} quickly.", spa: "Él está {ingSpa} {objSpa} rápidamente.", ans: "is {ing}" },
    { eng: "You are {ing} {obj} slowly.", spa: "Estás {ingSpa} {objSpa} despacio.", ans: "are {ing}" }
  ],
  "Present Perfect": [
    { eng: "I have {pp} {obj} already.", spa: "Ya he {ppSpa} {objSpa}.", ans: "have {pp}" },
    { eng: "He has {pp} {obj} recently.", spa: "Él ha {ppSpa} {objSpa} recientemente.", ans: "has {pp}" },
    { eng: "We have {pp} {obj} before.", spa: "Hemos {ppSpa} {objSpa} antes.", ans: "have {pp}" },
    { eng: "They have {pp} {obj} just now.", spa: "Ellos han {ppSpa} {objSpa} justo ahora.", ans: "have {pp}" },
    { eng: "She has {pp} {obj} twice.", spa: "Ella ha {ppSpa} {objSpa} dos veces.", ans: "has {pp}" }, 
    { eng: "You have {pp} {obj} enough.", spa: "Has {ppSpa} {objSpa} suficiente.", ans: "have {pp}" }
  ],
  "Present Perfect Continuous": [
    { eng: "I have been {ing} {obj} for two hours.", spa: "He estado {ingSpa} {objSpa} por dos horas.", ans: "have been {ing}" },
    { eng: "She has been {ing} {obj} since morning.", spa: "Ella ha estado {ingSpa} {objSpa} desde la mañana.", ans: "has been {ing}" },
    { eng: "We have been {ing} {obj} all day.", spa: "Hemos estado {ingSpa} {objSpa} todo el día.", ans: "have been {ing}" },
    { eng: "They have been {ing} {obj} lately.", spa: "Ellos han estado {ingSpa} {objSpa} últimamente.", ans: "have been {ing}" },
    { eng: "He has been {ing} {obj} non-stop.", spa: "Él ha estado {ingSpa} {objSpa} sin parar.", ans: "has been {ing}" }
  ],
  "Past Simple": [
    { eng: "I {past} {obj} yesterday.", spa: "Yo {pastSpa} {objSpa} ayer.", ans: "{past}" },
    { eng: "They {past} {obj} last week.", spa: "Ellos {pastSpa} {objSpa} la semana pasada.", ans: "{past}" },
    { eng: "She {past} {obj} suddenly.", spa: "Ella {pastSpa} {objSpa} de repente.", ans: "{past}" },
    { eng: "We {past} {obj} together.", spa: "Nosotros {pastSpa} {objSpa} juntos.", ans: "{past}" },
    { eng: "He {past} {obj} slowly.", spa: "Él {pastSpa} {objSpa} despacio.", ans: "{past}" },
    { eng: "You {past} {obj} that time.", spa: "Tú {pastSpa} {objSpa} esa vez.", ans: "{past}" }
  ],
  "Past Continuous": [
    { eng: "I was {ing} {obj} when you called.", spa: "Estaba {ingSpa} {objSpa} cuando llamaste.", ans: "was {ing}" },
    { eng: "They were {ing} {obj} all night.", spa: "Ellos estaban {ingSpa} {objSpa} toda la noche.", ans: "were {ing}" },
    { eng: "She was {ing} {obj} then.", spa: "Ella estaba {ingSpa} {objSpa} entonces.", ans: "was {ing}" },
    { eng: "We were {ing} {obj} at that time.", spa: "Estábamos {ingSpa} {objSpa} en ese momento.", ans: "were {ing}" },
    { eng: "He was {ing} {obj} while waiting.", spa: "Él estaba {ingSpa} {objSpa} mientras esperaba.", ans: "was {ing}" }
  ],
  "Past Perfect": [
    { eng: "I had {pp} {obj} before leaving.", spa: "Había {ppSpa} {objSpa} antes de salir.", ans: "had {pp}" },
    { eng: "She had {pp} {obj} by then.", spa: "Ella había {ppSpa} {objSpa} para entonces.", ans: "had {pp}" },
    { eng: "They had {pp} {obj} already.", spa: "Ellos ya habían {ppSpa} {objSpa}.", ans: "had {pp}" },
    { eng: "We had {pp} {obj} earlier.", spa: "Habíamos {ppSpa} {objSpa} más temprano.", ans: "had {pp}" }
  ],
  "Past Perfect Continuous": [
    { eng: "We had been {ing} {obj} for a long time.", spa: "Habíamos estado {ingSpa} {objSpa} por mucho tiempo.", ans: "had been {ing}" },
    { eng: "He had been {ing} {obj} before stopping.", spa: "Él había estado {ingSpa} {objSpa} antes de parar.", ans: "had been {ing}" },
    { eng: "I had been {ing} {obj} until noon.", spa: "Yo había estado {ingSpa} {objSpa} hasta el mediodía.", ans: "had been {ing}" }
  ],
  "Future Simple": [
    { eng: "I will {base} {obj} tomorrow.", spa: "{infSpa} {objSpa} mañana.", ans: "will {base}" },
    { eng: "It will {base} {obj} soon.", spa: "{infSpa} {objSpa} pronto.", ans: "will {base}" },
    { eng: "They will {base} {obj} later.", spa: "Ellos {infSpa} {objSpa} más tarde.", ans: "will {base}" },
    { eng: "We will {base} {obj} next year.", spa: "Nosotros {infSpa} {objSpa} el próximo año.", ans: "will {base}" },
    { eng: "She will {base} {obj} definitely.", spa: "Ella {infSpa} {objSpa} definitivamente.", ans: "will {base}" }
  ],
  "Future Continuous": [
    { eng: "I will be {ing} {obj} at 8 PM.", spa: "Estaré {ingSpa} {objSpa} a las 8 PM.", ans: "will be {ing}" },
    { eng: "They will be {ing} {obj} all day.", spa: "Ellos estarán {ingSpa} {objSpa} todo el día.", ans: "will be {ing}" },
    { eng: "We will be {ing} {obj} this time tomorrow.", spa: "Estaremos {ingSpa} {objSpa} mañana a esta hora.", ans: "will be {ing}" }
  ],
  "Future Perfect": [
    { eng: "I will have {pp} {obj} by then.", spa: "Habré {ppSpa} {objSpa} para entonces.", ans: "will have {pp}" },
    { eng: "She will have {pp} {obj} by tomorrow.", spa: "Ella habrá {ppSpa} {objSpa} para mañana.", ans: "will have {pp}" },
    { eng: "We will have {pp} {obj} soon.", spa: "Habremos {ppSpa} {objSpa} pronto.", ans: "will have {pp}" }
  ],
  "Future Perfect Continuous": [
    { eng: "She will have been {ing} {obj} for years.", spa: "Ella habrá estado {ingSpa} {objSpa} por años.", ans: "will have been {ing}" },
    { eng: "I will have been {ing} {obj} since Monday.", spa: "Habré estado {ingSpa} {objSpa} desde el lunes.", ans: "will have been {ing}" }
  ]
};

const generateFallbackExercise = (verbObj, tense) => {
  const templates = SENTENCE_TEMPLATES[tense] || SENTENCE_TEMPLATES["Present Simple"];
  const template = templates[Math.floor(Math.random() * templates.length)];
  
  // Fillers for Spanish side (simplified logic for fallback context)
  const ingSpa = `[${verbObj.spa} (ando/iendo)]`;
  const ppSpa = `[${verbObj.spa} (ado/ido)]`; 
  const pastSpa = `[${verbObj.spa} (pasado)]`;
  const infSpa = `[${verbObj.spa}]`;

  // Object handling
  const obj = verbObj.obj ? verbObj.obj : "";
  const objSpa = verbObj.objSpa ? verbObj.objSpa : "";

  // Replacements
  let sentence = template.eng
    .replace("{base}", verbObj.base)
    .replace("{s}", verbObj.s)
    .replace("{past}", verbObj.past)
    .replace("{pp}", verbObj.pp)
    .replace("{ing}", verbObj.ing)
    .replace("{obj}", obj); // Inject object if present

  let answer = template.ans
    .replace("{base}", verbObj.base)
    .replace("{s}", verbObj.s)
    .replace("{past}", verbObj.past)
    .replace("{pp}", verbObj.pp)
    .replace("{ing}", verbObj.ing);

  let spanishSentence = template.spa
    .replace("{spa}", `[${verbObj.spa}]`)
    .replace("{ingSpa}", ingSpa)
    .replace("{ppSpa}", ppSpa)
    .replace("{pastSpa}", pastSpa)
    .replace("{infSpa}", infSpa)
    .replace("{objSpa}", objSpa); // Inject spanish object

  // Cleanup extra spaces if object was empty
  sentence = sentence.replace(/\s+/g, ' ').trim();
  spanishSentence = spanishSentence.replace(/\s+/g, ' ').trim();

  // Split English sentence for the UI gap
  const parts = sentence.split(answer);
  const sentenceParts = parts.length >= 2 ? [parts[0], parts[1]] : ["", " " + sentence.replace(answer, "").trim()];

  return {
    id: `fallback-${Date.now()}-${Math.random()}`,
    verb: verbObj.inf,
    spanishVerb: verbObj.spa,
    tense: tense,
    sentenceParts: sentenceParts,
    spanishSentence: spanishSentence,
    answer: answer,
    hint: `The answer is '${answer}'`
  };
};

const ConjugationApp = () => {
  // State
  const [exercises, setExercises] = useState([]); // Active exercises
  const [prefetchedExercises, setPrefetchedExercises] = useState([]); // Background loaded exercises
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [userInput, setUserInput] = useState("");
  const [status, setStatus] = useState("idle"); // idle, correct, incorrect
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [showHint, setShowHint] = useState(false);
  
  // Loading States
  const [isFetching, setIsFetching] = useState(false); // For explicit loads (Settings btn)
  const [isPrefetching, setIsPrefetching] = useState(false); // For background loads
  
  const [apiError, setApiError] = useState(null);
  const [view, setView] = useState('settings'); // 'practice' | 'settings' | 'summary'
  
  // Settings State - Start Empty
  const [selectedTenses, setSelectedTenses] = useState([]);
  const [selectedVerbs, setSelectedVerbs] = useState([]);
  const [verbSearchTerm, setVerbSearchTerm] = useState("");

  const inputRef = useRef(null);
  const currentExercise = exercises[currentExerciseIndex];

  // Focus input on load and exercise change
  useEffect(() => {
    if (view === 'practice' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [currentExerciseIndex, view]);

  // --- BACKGROUND PREFETCHING LOGIC ---
  useEffect(() => {
    // Only prefetch if we are in practice or summary mode, 
    // we don't have a next batch ready, and we aren't currently fetching.
    if ((view === 'practice' || view === 'summary') && prefetchedExercises.length === 0 && !isPrefetching && !isFetching) {
      prefetchNextRound();
    }
  }, [view, prefetchedExercises.length, isPrefetching, isFetching]);

  const prefetchNextRound = async () => {
    setIsPrefetching(true);
    try {
      const newBatch = await getExercises(5, selectedTenses, selectedVerbs);
      if (newBatch && newBatch.length > 0) {
        setPrefetchedExercises(newBatch);
      }
    } catch (err) {
      console.warn("Background prefetch failed silently:", err);
    } finally {
      setIsPrefetching(false);
    }
  };

  const handleCheck = (e) => {
    e.preventDefault();
    if (!userInput.trim()) return;

    const cleanInput = userInput.trim().toLowerCase();
    const cleanAnswer = currentExercise.answer.toLowerCase();

    // Check for exact match or lenient match (ignoring punctuation)
    if (cleanInput === cleanAnswer || cleanInput === cleanAnswer.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g,"")) {
      setStatus("correct");
      setScore(score + 10);
      setStreak(streak + 1);
    } else {
      setStatus("incorrect");
      setStreak(0);
    }
  };

  const handleNext = () => {
    // Check if we reached the end of the current set
    if (currentExerciseIndex + 1 >= exercises.length) {
      setView('summary');
      return;
    }

    setUserInput("");
    setStatus("idle");
    setShowHint(false);
    setApiError(null);
    setCurrentExerciseIndex((prev) => prev + 1);
  };

  const handleRetry = () => {
    setStatus("idle");
    inputRef.current.focus();
  };

  // Toggle helpers
  const toggleTense = (tense) => {
    setSelectedTenses(prev => 
      prev.includes(tense) ? prev.filter(t => t !== tense) : [...prev, tense]
    );
  };

  const toggleVerb = (verb) => {
    setSelectedVerbs(prev => 
      prev.includes(verb) ? prev.filter(v => v !== verb) : [...prev, verb]
    );
  };

  const selectAllTenses = () => setSelectedTenses(ALL_TENSES);
  const selectNoTenses = () => setSelectedTenses([]);
  const selectAllVerbs = () => setSelectedVerbs(ALL_VERBS);
  const selectNoVerbs = () => setSelectedVerbs([]);


  // --- CORE API & FALLBACK FETCHING LOGIC ---

  // Fetches a single sentence for a given pattern from API
  const fetchSingleExerciseApi = async (pattern, proxyIndex = 0) => {
    const proxies = [
      (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
      (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`
    ];

    if (proxyIndex >= proxies.length) return null;

    try {
      const params = new URLSearchParams({
        from: 'eng',
        to: 'spa',
        query: pattern.term, // Removed strict quotes to increase hits
        trans_filter: 'limit',
        trans_to: 'spa',
        sort: 'relevance'
      });

      const tatoebaUrl = `https://tatoeba.org/eng/api_v0/search?${params.toString()}`;
      const proxyUrl = proxies[proxyIndex](tatoebaUrl);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000); // 6 second timeout per request

      const response = await fetch(proxyUrl, {
        method: 'GET',
        signal: controller.signal,
        headers: { 'Cache-Control': 'no-cache' }
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        // If first proxy fails, try the next one
        return fetchSingleExerciseApi(pattern, proxyIndex + 1);
      }
      
      const data = await response.json();
      
      // Filter logic: ensure the sentence actually contains the target word word-bounded
      // We use a regex to ensure "work" doesn't match "working" if we specifically wanted "work"
      const wordBoundRegex = new RegExp(`\\b${pattern.term}\\b`, 'i');

      const validResults = data.results.filter(item => 
        item.translations && 
        item.translations.length > 0 && 
        item.translations[0].length > 0 &&
        wordBoundRegex.test(item.text)
      );

      if (validResults.length === 0) return null;

      const randomResult = validResults[Math.floor(Math.random() * validResults.length)];
      const englishSentence = randomResult.text;
      const spanishSentence = randomResult.translations[0][0].text;
      
      // Match again to find position
      const match = englishSentence.match(wordBoundRegex);
      
      if (!match) return null;
      
      const splitIndex = match.index;
      const part1 = englishSentence.substring(0, splitIndex);
      const part2 = englishSentence.substring(splitIndex + match[0].length);

      return {
        id: `api-${Date.now()}-${Math.random()}`,
        verb: pattern.verb,
        spanishVerb: pattern.spanishVerb,
        tense: pattern.tense,
        sentenceParts: [part1, part2],
        spanishSentence: spanishSentence,
        answer: match[0],
        hint: `The answer is '${pattern.term}' (Fetched from Tatoeba)`
      };
    } catch (err) {
      if (err.name !== 'AbortError') {
         // If network error, try next proxy
         return fetchSingleExerciseApi(pattern, proxyIndex + 1);
      }
      return null;
    }
  };

  // Main function to get exercises (API + Fallback)
  const getExercises = async (targetCount, tenses, verbs) => {
    const eligiblePatterns = SEARCH_PATTERNS.filter(p => 
      tenses.includes(p.tense) && verbs.includes(p.verb)
    );

    if (eligiblePatterns.length === 0) {
      throw new Error("No verbs match this specific combination of Tense & Verb.");
    }

    const shuffledPatterns = [...eligiblePatterns].sort(() => 0.5 - Math.random());

    const resultsContainer = [];
    const seenSentences = new Set(); 
    
    let patternIndex = 0;

    // Try hard to fetch from API first (up to 25 attempts)
    const apiAttempts = Math.min(shuffledPatterns.length, 25); 
    
    while (resultsContainer.length < targetCount && patternIndex < apiAttempts) {
      const needed = targetCount - resultsContainer.length;
      // Fetch in small parallel batches to speed up
      const batchSize = Math.min(needed + 2, 5); 
      const batchPatterns = shuffledPatterns.slice(patternIndex, patternIndex + batchSize);
      patternIndex += batchSize;

      if (batchPatterns.length === 0) break;

      const results = await Promise.all(
        batchPatterns.map(pattern => fetchSingleExerciseApi(pattern))
      );

      const validResults = results.filter(ex => ex !== null);
      
      for (const result of validResults) {
          // Check for duplicates
          if (resultsContainer.length < targetCount && !seenSentences.has(result.spanishSentence)) {
              resultsContainer.push(result);
              seenSentences.add(result.spanishSentence);
          }
      }
    }

    // Fallback Generator
    let attempts = 0;
    const maxAttempts = targetCount * 10; 

    while (resultsContainer.length < targetCount && attempts < maxAttempts) {
      attempts++;
      
      const randomPattern = eligiblePatterns[Math.floor(Math.random() * eligiblePatterns.length)];
      const verbObj = FULL_VERB_LIST.find(v => v.inf === randomPattern.verb);
      
      if (verbObj) {
        const generated = generateFallbackExercise(verbObj, randomPattern.tense);
        if (!seenSentences.has(generated.spanishSentence)) {
            resultsContainer.push(generated);
            seenSentences.add(generated.spanishSentence);
        }
      }
    }

    return resultsContainer;
  };

  // Handler for explicit "Start Practice" or "Load Next Round" buttons
  const handleLoadExercises = async (isNextRound = false) => {
    if (isNextRound && prefetchedExercises.length > 0) {
      setExercises(prefetchedExercises);
      setPrefetchedExercises([]); 
      setCurrentExerciseIndex(0);
      setUserInput("");
      setStatus("idle");
      setView('practice');
      return;
    }

    setIsFetching(true);
    setApiError(null);

    try {
      const newExercises = await getExercises(5, selectedTenses, selectedVerbs);
      setExercises(newExercises);
      setPrefetchedExercises([]); 
      setCurrentExerciseIndex(0);
      setUserInput("");
      setStatus("idle");
      setView('practice'); 
    } catch (err) {
      console.error("Batch fetch failed:", err);
      setApiError(err.message || "Batch load failed.");
    } finally {
      setIsFetching(false);
    }
  };


  // Render Practice View
  const renderPracticeView = () => {
    if (!currentExercise) return null;
    const isFallback = currentExercise.id.toString().startsWith('fallback');

    return (
      <main className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100 relative">
        <button 
          onClick={() => setView('settings')}
          className="absolute top-4 right-4 text-slate-300 hover:text-blue-500 transition-colors"
          title="Customize Practice"
        >
          <Sliders size={20} />
        </button>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 h-2">
          <div 
            className="bg-blue-500 h-2 transition-all duration-500 ease-out"
            style={{ width: `${((currentExerciseIndex + 1) / exercises.length) * 100}%` }}
          ></div>
        </div>

        <div className="p-6 sm:p-8">
          <div className="text-center mb-8">
            <div className="inline-block px-4 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-semibold mb-2">
              {currentExercise.tense}
            </div>
            <h2 className="text-3xl font-bold text-slate-800 mb-1">{currentExercise.verb}</h2>
            <p className="text-slate-500 text-lg italic mb-2">{currentExercise.spanishVerb}</p>
            
            {isFallback && (
               <div className="mb-2 flex justify-center">
                 <span className="text-[10px] uppercase tracking-wider bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                   <Zap size={10} fill="currentColor" /> Generated
                 </span>
               </div>
            )}

            <p className="text-slate-400 text-sm font-medium">"{currentExercise.spanishSentence}"</p>
          </div>

          <form onSubmit={handleCheck} className="mb-6">
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 text-lg sm:text-xl leading-relaxed text-center shadow-inner">
              <span>{currentExercise.sentenceParts[0]} </span>
              <span className="relative inline-block mx-1">
                <input
                  ref={inputRef}
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  disabled={status === 'correct'}
                  className={`
                    w-32 bg-white border-b-2 outline-none text-center font-semibold text-blue-700 px-1 py-0.5 rounded-t transition-colors
                    ${status === 'idle' ? 'border-slate-300 focus:border-blue-500 focus:bg-blue-50' : ''}
                    ${status === 'correct' ? 'border-green-500 bg-green-50 text-green-700' : ''}
                    ${status === 'incorrect' ? 'border-red-500 bg-red-50 text-red-700' : ''}
                  `}
                  placeholder="..."
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck="false"
                />
              </span>
              <span> {currentExercise.sentenceParts[1]}</span>
            </div>

            {status !== 'correct' && (
              <div className="mt-4 flex justify-center">
                <button 
                  type="button"
                  onClick={() => setShowHint(!showHint)}
                  className="text-slate-400 hover:text-blue-500 text-sm flex items-center gap-1 transition-colors"
                >
                  <Sparkles size={14} />
                  {showHint ? currentExercise.hint : "¿Necesitas una pista? / Need a hint?"}
                </button>
              </div>
            )}
          </form>

          <div className="mt-8 h-16"> 
            {status === 'idle' && (
              <button
                onClick={handleCheck}
                disabled={!userInput.trim()}
                className={`w-full py-3.5 rounded-xl font-bold text-white shadow-lg transition-all transform active:scale-95 flex items-center justify-center gap-2
                  ${userInput.trim() ? 'bg-blue-600 hover:bg-blue-700 hover:shadow-blue-500/25' : 'bg-slate-300 cursor-not-allowed'}
                `}
              >
                Comprobar / Check
              </button>
            )}

            {status === 'correct' && (
              <button
                onClick={handleNext}
                className="w-full py-3.5 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold shadow-lg shadow-green-500/25 transition-all transform active:scale-95 flex items-center justify-center gap-2 animate-in fade-in slide-in-from-bottom-2"
              >
                <span>Siguiente / Next</span>
                <ArrowRight size={20} />
              </button>
            )}

            {status === 'incorrect' && (
              <div className="flex gap-3 animate-in fade-in slide-in-from-bottom-2">
                 <div className="flex-1 bg-red-50 border border-red-100 rounded-xl flex items-center justify-center px-4 text-red-600 font-medium">
                    Incorrecto
                 </div>
                 <button
                  onClick={handleRetry}
                  className="px-6 py-3.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold shadow-lg transition-all transform active:scale-95 flex items-center justify-center gap-2"
                >
                  <RefreshCw size={20} />
                  <span>Reintentar</span>
                </button>
              </div>
            )}
          </div>

          <div className={`mt-4 text-center text-sm font-medium transition-colors duration-300 h-6
            ${status === 'correct' ? 'text-green-600' : ''}
            ${status === 'incorrect' ? 'text-red-500' : ''}
            ${status === 'idle' ? 'opacity-0' : 'opacity-100'}
          `}>
            {status === 'correct' ? '¡Excelente! / Excellent!' : status === 'incorrect' ? 'Inténtalo de nuevo / Try again' : ''}
          </div>
        </div>
        
        <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-center">
           <div className="text-xs text-slate-400 flex items-center gap-1">
              <span className="font-semibold">{exercises.length}</span> exercises in queue
           </div>
        </div>
      </main>
    );
  };

  // Render Summary View
  const renderSummaryView = () => (
    <main className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 text-center p-8">
      <div className="flex justify-center mb-6">
        <div className="bg-yellow-100 p-4 rounded-full text-yellow-600">
          <Trophy size={48} />
        </div>
      </div>
      
      <h2 className="text-2xl font-bold text-slate-800 mb-2">Round Complete!</h2>
      <p className="text-slate-500 mb-8">You've finished this set of exercises.</p>
      
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
          <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Total Score</div>
          <div className="text-2xl font-bold text-blue-600">{score}</div>
        </div>
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
           <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Current Streak</div>
           <div className="text-2xl font-bold text-orange-500">{streak}</div>
        </div>
      </div>

      <button 
        onClick={() => handleLoadExercises(true)}
        disabled={isFetching}
        className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2"
      >
        {/* Show loading state OR if we have prefetched data, show a ready indicator */}
        {isFetching ? (
          <>
            <Loader2 size={20} className="animate-spin" />
            <span>Loading...</span>
          </>
        ) : prefetchedExercises.length > 0 ? (
          <>
            <Sparkles size={20} className="text-yellow-300" />
            <span>Start Next Round (Ready!)</span>
          </>
        ) : (
          <>
            <RefreshCw size={20} />
            <span>Load Next Round</span>
          </>
        )}
      </button>
      
      <button 
        onClick={() => setView('settings')}
        className="mt-4 text-slate-400 hover:text-blue-500 text-sm font-medium"
      >
        Adjust Settings
      </button>
    </main>
  );

  // Render Settings View
  const renderSettingsView = () => (
    <main className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 flex flex-col h-[80vh]">
      <div className="p-6 pb-2 border-b border-slate-100">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Settings size={20} className="text-blue-600"/>
            Practice Settings
          </h2>
          {/* Close Button - Hidden if no exercises exist to prevent empty state */}
          {exercises.length > 0 && (
            <button onClick={() => setView('practice')} className="text-slate-400 hover:text-slate-600">
              <X size={24} />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {/* Tenses Selection */}
        <div>
          <div className="flex justify-between items-end mb-3 sticky top-0 bg-white z-10 pb-2">
             <label className="text-sm font-bold text-slate-700 uppercase tracking-wide">Tenses</label>
             <div className="flex gap-2 text-xs">
                <button onClick={selectAllTenses} className="text-blue-600 hover:underline">All</button>
                <span className="text-slate-300">|</span>
                <button onClick={selectNoTenses} className="text-blue-600 hover:underline">None</button>
             </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {ALL_TENSES.map(tense => (
              <button
                key={tense}
                onClick={() => toggleTense(tense)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  selectedTenses.includes(tense) 
                    ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-500 ring-offset-1' 
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {tense}
              </button>
            ))}
          </div>
        </div>

        {/* Verbs Selection */}
        <div>
          <div className="flex flex-col gap-2 mb-3 sticky top-0 bg-white z-10 pb-2">
             <div className="flex justify-between items-end">
                <label className="text-sm font-bold text-slate-700 uppercase tracking-wide">
                    Verbs <span className="text-blue-600 ml-1 text-xs normal-case">({selectedVerbs.length} selected)</span>
                </label>
                <div className="flex gap-2 text-xs">
                    <button onClick={selectAllVerbs} className="text-blue-600 hover:underline">All</button>
                    <span className="text-slate-300">|</span>
                    <button onClick={selectNoVerbs} className="text-blue-600 hover:underline">None</button>
                </div>
             </div>
             
             {/* Search Bar */}
             <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search verbs..." 
                  value={verbSearchTerm}
                  onChange={(e) => setVerbSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
             </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {verbSearchTerm.trim() === "" ? (
                <div className="w-full py-8 text-center border-2 border-dashed border-slate-100 rounded-xl text-slate-400 text-sm">
                    <Search size={24} className="mx-auto mb-2 opacity-50" />
                    <p>Type above to find verbs</p>
                </div>
            ) : (
                ALL_VERBS.filter(v => v.toLowerCase().includes(verbSearchTerm.toLowerCase())).map(verb => (
                  <button
                    key={verb}
                    onClick={() => toggleVerb(verb)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      selectedVerbs.includes(verb) 
                        ? 'bg-emerald-100 text-emerald-700 ring-2 ring-emerald-500 ring-offset-1' 
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}
                  >
                    {verb}
                  </button>
                ))
            )}
            {verbSearchTerm.trim() !== "" && ALL_VERBS.filter(v => v.toLowerCase().includes(verbSearchTerm.toLowerCase())).length === 0 && (
                <p className="text-xs text-slate-400 w-full text-center py-4">No verbs found matching "{verbSearchTerm}"</p>
            )}
          </div>
        </div>
      </div>

      <div className="p-6 border-t border-slate-100 bg-slate-50/50">
        {apiError && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-start gap-2">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <p>{apiError}</p>
          </div>
        )}

        <button 
          onClick={() => handleLoadExercises(false)}
          disabled={isFetching || selectedTenses.length === 0 || selectedVerbs.length === 0}
          className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2"
        >
          {isFetching ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <Globe size={20} />
          )}
          <span>{isFetching ? "Searching..." : "Start Practice (5 Sentences)"}</span>
        </button>
      </div>
    </main>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col items-center py-8 px-4">
      {/* Header */}
      <header className="w-full max-w-md flex justify-between items-center mb-8">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 text-white p-2 rounded-lg shadow-sm">
            <BookOpen size={24} />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">Verb Master</h1>
            <p className="text-xs text-slate-500">Practice English Verbs</p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <div className="flex flex-col items-end">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Score</span>
            <span className="font-mono font-bold text-blue-600">{score}</span>
          </div>
          <div className="flex flex-col items-end">
             <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Racha</span>
             <div className="flex items-center gap-1 text-orange-500 font-bold">
               <Trophy size={14} />
               <span>{streak}</span>
             </div>
          </div>
        </div>
      </header>

      {/* Main Content Switcher */}
      {view === 'practice' && renderPracticeView()}
      {view === 'settings' && renderSettingsView()}
      {view === 'summary' && renderSummaryView()}

      <div className="mt-8 text-slate-400 text-sm max-w-xs text-center">
        Created for Spanish speakers learning English. <br/> Data provided by Tatoeba.org
      </div>
    </div>
  );
};

export default ConjugationApp;