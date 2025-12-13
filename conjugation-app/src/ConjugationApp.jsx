import React, { useState, useEffect, useRef } from 'react';
import { Check, ArrowRight, RefreshCw, BookOpen, Trophy, AlertCircle, Sparkles, Globe, Loader2, Settings, Sliders, X, Filter, Search, Zap, Moon, Sun, MessageCircleQuestion, FileText } from 'lucide-react';

// --- DATA & PATTERN GENERATION ---

// Helper to generate regular verb forms automatically
const createRegularVerb = (english, spanish, obj = "", objSpa = "") => {
  const cleanEnglish = english.replace(/^To\s+/i, "").trim();
  const base = cleanEnglish.toLowerCase();
  
  let past = base + "ed";
  let pp = base + "ed";
  let ing = base + "ing";
  let s = base + "s";

  // Simple heuristic for CVC doubling (e.g., stop -> stopping, prefer -> preferring)
  const isCVC = (str) => /[^aeiou][aeiou][b-df-hj-np-tv-z]$/.test(str);
  const shouldDouble = (str) => {
      // Always double for short CVC words (stop, plan)
      if (str.length <= 4 && isCVC(str)) return true;
      // Double for specific multi-syllable verbs ending in CVC with stress on last syllable
      if (['fer', 'cur', 'mit', 'pel'].some(end => str.endsWith(end))) return true;
      return false;
  };

  if (base.endsWith("e")) {
    past = base + "d";
    pp = base + "d";
    ing = base.slice(0, -1) + "ing";
  } else if (base.endsWith("y") && !['a','e','i','o','u'].includes(base[base.length - 2])) {
    past = base.slice(0, -1) + "ied";
    pp = base.slice(0, -1) + "ied";
    s = base.slice(0, -1) + "ies";
  } else if (shouldDouble(base)) {
    const lastChar = base.slice(-1);
    past = base + lastChar + "ed";
    pp = base + lastChar + "ed";
    ing = base + lastChar + "ing";
  }
  
  return { inf: `To ${cleanEnglish}`, spa: spanish, base, past, pp, ing, s, obj, objSpa };
};

// 1. Irregular Verbs
const IRREGULAR_VERBS = [
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

// Combine Irregular and Regular verbs into one master list
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
  
  // Theme State
  const [isDarkMode, setIsDarkMode] = useState(false);

  // AI Feature States
  const [isExplaining, setIsExplaining] = useState(false);
  const [explanation, setExplanation] = useState(null);
  const [isGeneratingStory, setIsGeneratingStory] = useState(false);
  const [story, setStory] = useState(null);

  const apiKey = ""; // Provided by environment

  // Initialize theme based on system preference
  useEffect(() => {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDarkMode(true);
    }
  }, []);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  // Settings State - Start Empty
  const [selectedTenses, setSelectedTenses] = useState([]);
  const [selectedVerbs, setSelectedVerbs] = useState([]);
  const [verbSearchTerm, setVerbSearchTerm] = useState("");
  const [batchSize, setBatchSize] = useState(5);

  const inputRef = useRef(null);
  const currentExercise = exercises[currentExerciseIndex];

  // Focus input on load and exercise change
  useEffect(() => {
    if (view === 'practice' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [currentExerciseIndex, view]);

  // Reset explanation when moving to next exercise
  useEffect(() => {
    setExplanation(null);
  }, [currentExerciseIndex]);

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
      const newBatch = await getExercises(batchSize, selectedTenses, selectedVerbs);
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

  // --- GEMINI API FUNCTIONS ---

  const explainGrammar = async () => {
    if (!currentExercise) return;
    
    setIsExplaining(true);
    setExplanation(null);

    const fullSentence = `${currentExercise.sentenceParts[0]}${currentExercise.answer}${currentExercise.sentenceParts[1]}`;
    
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ 
            parts: [{ 
              text: `Act as an English teacher for Spanish speakers. Explain briefly in Spanish the grammatical rule for using "${currentExercise.answer}" in the sentence "${fullSentence}". The verb is "${currentExercise.verb}" and the tense is "${currentExercise.tense}". Keep the explanation simple, concise (max 2-3 sentences), and helpful.` 
            }] 
          }]
        })
      });

      if (!response.ok) throw new Error("Failed to fetch explanation");
      
      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (text) {
        setExplanation(text);
      } else {
        setExplanation("Lo siento, no pude generar una explicación en este momento.");
      }
    } catch (error) {
      console.error("Explanation error:", error);
      setExplanation("Error de conexión. Inténtalo de nuevo.");
    } finally {
      setIsExplaining(false);
    }
  };

  const generateStory = async () => {
    if (exercises.length === 0) return;
    
    setIsGeneratingStory(true);
    setStory(null);

    const verbList = exercises.map(e => e.verb).join(', ');

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ 
            parts: [{ 
              text: `Write a very short, simple story (max 100 words) in English using these verbs: ${verbList}. After the story, provide a Spanish translation.` 
            }] 
          }]
        })
      });

      if (!response.ok) throw new Error("Failed to generate story");
      
      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (text) {
        setStory(text);
      } else {
        setStory("Lo siento, no pude generar la historia.");
      }
    } catch (error) {
      console.error("Story error:", error);
      setStory("Error de conexión.");
    } finally {
      setIsGeneratingStory(false);
    }
  };

  // Helper to fetch Gemini generated exercises
  const fetchGeminiExercises = async (patterns) => {
    if (!apiKey && typeof apiKey !== 'string') return [];
    
    // Prepare input list for the prompt
    const requestList = patterns.map(p => JSON.stringify({
      verb: p.verb,
      tense: p.tense,
      spanishVerb: p.spanishVerb
    })).join(',\n');
    
    const prompt = `
      You are an English language teacher. Generate ${patterns.length} unique practice exercises based on the input list below.
      
      Input Data:
      ${requestList}
      
      Instructions:
      1. For each item, create a **coherent, natural, everyday English sentence** that correctly uses the specified 'verb' in the specified 'tense'.
      2. The sentences should make sense in a real-world context. Avoid robotic or disjointed phrases.
      3. IMPORTANT: Enclose the specific conjugated verb phrase (the answer key) in square brackets []. 
         - Example (Past Simple, To Eat): "I [ate] an apple for lunch because I was hungry."
         - Example (Present Perfect, To Go): "She [has gone] to the store, so she isn't here right now."
         - Example (Present Continuous, To Prefer): "She [is preferring] tea over coffee these days."
      4. Provide a natural Spanish translation for each sentence.
      
      Return a JSON ARRAY of objects with this exact schema:
      {
        "verb": "To Eat",
        "tense": "Past Simple",
        "spanishVerb": "Comer",
        "english_masked": "I [ate] an apple for lunch.",
        "spanish": "Me comí una manzana para el almuerzo."
      }
    `;

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json" }
        })
      });

      if (!response.ok) return [];

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) return [];
      
      const json = JSON.parse(text);
      if (!Array.isArray(json)) return [];

      return json.map(item => {
        // Parse "I [ate] the apple" -> part1: "I ", answer: "ate", part2: " the apple"
        const match = item.english_masked && item.english_masked.match ? item.english_masked.match(/^(.*?)\[(.*?)\](.*)$/) : null;
        
        if (!match) return null;
        
        return {
          id: `gemini-${Date.now()}-${Math.random()}`,
          verb: item.verb,
          spanishVerb: item.spanishVerb,
          tense: item.tense,
          sentenceParts: [match[1], match[3]], 
          spanishSentence: item.spanish,
          answer: match[2], 
          hint: `The answer is '${match[2]}' (AI Generated)`
        };
      }).filter(i => i !== null);

    } catch (e) {
      console.warn("Gemini generation failed.", e);
      return [];
    }
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

    // NEW STEP: Gemini Fallback
    let needed = targetCount - resultsContainer.length;
    if (needed > 0) {
       const geminiPatterns = [];
       for(let i=0; i<needed; i++) {
          const randomPattern = shuffledPatterns[Math.floor(Math.random() * shuffledPatterns.length)];
          if (randomPattern) geminiPatterns.push(randomPattern);
       }
       
       if (geminiPatterns.length > 0) {
         const aiExercises = await fetchGeminiExercises(geminiPatterns);
         
         for (const ex of aiExercises) {
            if (resultsContainer.length < targetCount && !seenSentences.has(ex.spanishSentence)) {
               resultsContainer.push(ex);
               seenSentences.add(ex.spanishSentence);
            }
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
      setStory(null); // Clear previous story
      return;
    }

    setIsFetching(true);
    setApiError(null);
    setStory(null);

    try {
      const newExercises = await getExercises(batchSize, selectedTenses, selectedVerbs);
      
      if (newExercises.length === 0) {
        throw new Error("Could not find any exercises. Please try selecting different verbs or tenses.");
      }

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
    const isGemini = currentExercise.id.toString().startsWith('gemini');

    return (
      <main className={`w-full max-w-md rounded-2xl shadow-xl overflow-hidden border relative transition-colors duration-300 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
        <button 
          onClick={() => setView('settings')}
          className={`absolute top-4 right-4 transition-colors ${isDarkMode ? 'text-slate-600 hover:text-blue-400' : 'text-slate-300 hover:text-blue-500'}`}
          title="Customize Practice"
        >
          <Sliders size={20} />
        </button>

        {/* Progress Bar */}
        <div className={`w-full h-2 ${isDarkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
          <div 
            className="bg-blue-500 h-2 transition-all duration-500 ease-out"
            style={{ width: `${((currentExerciseIndex + 1) / exercises.length) * 100}%` }}
          ></div>
        </div>

        <div className="p-6 sm:p-8">
          <div className="text-center mb-8">
            <div className={`inline-block px-4 py-1 rounded-full text-sm font-semibold mb-2 ${isDarkMode ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-50 text-blue-700'}`}>
              {currentExercise.tense}
            </div>
            <h2 className={`text-3xl font-bold mb-1 ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>{currentExercise.verb}</h2>
            <p className={`text-lg italic mb-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{currentExercise.spanishVerb}</p>
            
            {(isGemini) && (
               <div className="mb-2 flex justify-center">
                 <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1 ${isDarkMode ? 'bg-orange-900/30 text-orange-300' : 'bg-orange-100 text-orange-600'}`}>
                   <Zap size={10} fill="currentColor" /> AI Generated
                 </span>
               </div>
            )}

            <p className={`text-sm font-medium ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>"{currentExercise.spanishSentence}"</p>
          </div>

          <form onSubmit={handleCheck} className="mb-6">
            <div className={`p-6 rounded-xl border text-lg sm:text-xl leading-relaxed text-center shadow-inner transition-colors duration-300 ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'}`}>
              <span>{currentExercise.sentenceParts[0]} </span>
              <span className="relative inline-block mx-1">
                <input
                  ref={inputRef}
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  disabled={status === 'correct'}
                  className={`
                    w-32 border-b-2 outline-none text-center font-semibold px-1 py-0.5 rounded-t transition-colors
                    ${status === 'idle' 
                        ? (isDarkMode ? 'bg-slate-700 border-slate-600 text-blue-300 focus:bg-slate-600' : 'bg-white border-slate-300 text-blue-700 focus:bg-blue-50') 
                        : ''}
                    ${status === 'correct' 
                        ? (isDarkMode ? 'border-green-500 bg-green-900/30 text-green-300' : 'border-green-500 bg-green-50 text-green-700') 
                        : ''}
                    ${status === 'incorrect' 
                        ? (isDarkMode ? 'border-red-500 bg-red-900/30 text-red-300' : 'border-red-500 bg-red-50 text-red-700') 
                        : ''}
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
                  className={`text-sm flex items-center gap-1 transition-colors ${isDarkMode ? 'text-slate-500 hover:text-blue-400' : 'text-slate-400 hover:text-blue-500'}`}
                >
                  <Sparkles size={14} />
                  {showHint ? currentExercise.hint : "¿Necesitas una pista? / Need a hint?"}
                </button>
              </div>
            )}
          </form>

          {/* Explanation Area (Gemini Integration) */}
          {status !== 'idle' && (
            <div className="mb-6 animate-in fade-in slide-in-from-top-2">
              {!explanation ? (
                <button 
                  onClick={explainGrammar}
                  disabled={isExplaining}
                  className={`w-full py-2 px-4 rounded-lg border flex items-center justify-center gap-2 text-sm font-medium transition-colors
                    ${isDarkMode 
                      ? 'border-indigo-800 bg-indigo-900/20 text-indigo-300 hover:bg-indigo-900/40' 
                      : 'border-indigo-100 bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
                    }`}
                >
                  {isExplaining ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Generando explicación...
                    </>
                  ) : (
                    <>
                      <MessageCircleQuestion size={16} />
                      ✨ Explicar Gramática (AI)
                    </>
                  )}
                </button>
              ) : (
                <div className={`p-4 rounded-lg border text-sm text-left leading-relaxed ${isDarkMode ? 'bg-indigo-950/30 border-indigo-800 text-indigo-200' : 'bg-indigo-50 border-indigo-100 text-indigo-800'}`}>
                  <div className="flex items-start gap-2">
                    <Sparkles size={16} className="shrink-0 mt-0.5 opacity-70" />
                    <p>{explanation}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="mt-8 h-16"> 
            {status === 'idle' && (
              <button
                onClick={handleCheck}
                disabled={!userInput.trim()}
                className={`w-full py-3.5 rounded-xl font-bold text-white shadow-lg transition-all transform active:scale-95 flex items-center justify-center gap-2
                  ${userInput.trim() ? 'bg-blue-600 hover:bg-blue-700 hover:shadow-blue-500/25' : (isDarkMode ? 'bg-slate-700 cursor-not-allowed' : 'bg-slate-300 cursor-not-allowed')}
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
                 <div className={`flex-1 border rounded-xl flex items-center justify-center px-4 font-medium ${isDarkMode ? 'bg-red-900/30 border-red-800 text-red-300' : 'bg-red-50 border-red-100 text-red-600'}`}>
                   Incorrecto
                 </div>
                 <button
                  onClick={handleRetry}
                  className={`px-6 py-3.5 text-white rounded-xl font-bold shadow-lg transition-all transform active:scale-95 flex items-center justify-center gap-2 ${isDarkMode ? 'bg-slate-700 hover:bg-slate-600' : 'bg-slate-800 hover:bg-slate-900'}`}
                >
                  <RefreshCw size={20} />
                  <span>Reintentar</span>
                </button>
              </div>
            )}
          </div>

          <div className={`mt-4 text-center text-sm font-medium transition-colors duration-300 h-6
            ${status === 'correct' ? (isDarkMode ? 'text-green-400' : 'text-green-600') : ''}
            ${status === 'incorrect' ? (isDarkMode ? 'text-red-400' : 'text-red-500') : ''}
            ${status === 'idle' ? 'opacity-0' : 'opacity-100'}
          `}>
            {status === 'correct' ? '¡Excelente! / Excellent!' : status === 'incorrect' ? 'Inténtalo de nuevo / Try again' : ''}
          </div>
        </div>
        
        <div className={`p-4 border-t flex justify-center ${isDarkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
           <div className={`text-xs flex items-center gap-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
             <span className="font-semibold">{exercises.length}</span> exercises in queue
           </div>
        </div>
      </main>
    );
  };

  // Render Summary View
  const renderSummaryView = () => (
    <main className={`w-full max-w-md rounded-2xl shadow-xl overflow-hidden border animate-in fade-in zoom-in-95 text-center p-8 transition-colors duration-300 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
      <div className="flex justify-center mb-6">
        <div className={`p-4 rounded-full ${isDarkMode ? 'bg-yellow-900/30 text-yellow-400' : 'bg-yellow-100 text-yellow-600'}`}>
          <Trophy size={48} />
        </div>
      </div>
      
      <h2 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>Round Complete!</h2>
      <p className={`mb-8 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>You've finished this set of exercises.</p>
      
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
          <div className={`text-xs font-bold uppercase tracking-wider mb-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Total Score</div>
          <div className={`text-2xl font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>{score}</div>
        </div>
        <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
           <div className={`text-xs font-bold uppercase tracking-wider mb-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Current Streak</div>
           <div className={`text-2xl font-bold ${isDarkMode ? 'text-orange-400' : 'text-orange-500'}`}>{streak}</div>
        </div>
      </div>

      {/* Story Generator Feature */}
      <div className="mb-8">
        {!story ? (
          <button 
            onClick={generateStory}
            disabled={isGeneratingStory}
            className={`w-full py-3 px-4 rounded-xl border border-dashed flex items-center justify-center gap-2 text-sm font-medium transition-all
              ${isDarkMode 
                ? 'border-purple-700 bg-purple-900/20 text-purple-300 hover:bg-purple-900/40' 
                : 'border-purple-200 bg-purple-50 text-purple-600 hover:bg-purple-100'
              }`}
          >
            {isGeneratingStory ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Creando historia...
              </>
            ) : (
              <>
                <FileText size={18} />
                ✨ Generar Historia con mis verbos (AI)
              </>
            )}
          </button>
        ) : (
          <div className={`p-5 rounded-xl border text-left text-sm leading-relaxed max-h-64 overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95 ${isDarkMode ? 'bg-purple-950/30 border-purple-800 text-purple-100' : 'bg-purple-50 border-purple-100 text-slate-700'}`}>
            <h3 className="font-bold mb-2 flex items-center gap-2 text-purple-500">
              <Sparkles size={16} /> Your Story
            </h3>
            <p className="whitespace-pre-wrap">{story}</p>
          </div>
        )}
      </div>

      <button 
        onClick={() => handleLoadExercises(true)}
        disabled={isFetching}
        className={`w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2 ${isFetching ? (isDarkMode ? 'disabled:bg-slate-700' : 'disabled:bg-slate-300') : ''}`}
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
        className={`mt-4 text-sm font-medium ${isDarkMode ? 'text-slate-400 hover:text-blue-400' : 'text-slate-400 hover:text-blue-500'}`}
      >
        Adjust Settings
      </button>
    </main>
  );

  // Render Settings View
  const renderSettingsView = () => (
    <main className={`w-full max-w-md rounded-2xl shadow-xl overflow-hidden border animate-in fade-in zoom-in-95 flex flex-col h-[80vh] transition-colors duration-300 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
      <div className={`p-6 pb-2 border-b ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
        <div className="flex justify-between items-center mb-4">
          <h2 className={`text-xl font-bold flex items-center gap-2 ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>
            <Settings size={20} className={isDarkMode ? 'text-blue-400' : 'text-blue-600'}/>
            Practice Settings
          </h2>
          {/* Close Button - Hidden if no exercises exist to prevent empty state */}
          {exercises.length > 0 && (
            <button onClick={() => setView('practice')} className={`transition-colors ${isDarkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-400 hover:text-slate-600'}`}>
              <X size={24} />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
        {/* Batch Size Selection */}
        <div>
            <label className={`text-sm font-bold uppercase tracking-wide mb-3 block ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                Questions per Round
            </label>
            <div className="flex gap-2">
                {[5, 10, 15, 20].map(size => (
                    <button
                        key={size}
                        onClick={() => setBatchSize(size)}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                            batchSize === size
                                ? (isDarkMode ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'bg-blue-600 text-white shadow-lg shadow-blue-200')
                                : (isDarkMode ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-slate-100 text-slate-500 hover:bg-slate-200')
                        }`}
                    >
                        {size}
                    </button>
                ))}
            </div>
        </div>

        {/* Tenses Selection */}
        <div>
          <div className={`flex justify-between items-end mb-3 sticky top-0 z-10 pb-2 transition-colors ${isDarkMode ? 'bg-slate-900' : 'bg-white'}`}>
              <label className={`text-sm font-bold uppercase tracking-wide ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Tenses</label>
              <div className="flex gap-2 text-xs">
                 <button onClick={selectAllTenses} className={`hover:underline ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>All</button>
                 <span className={isDarkMode ? 'text-slate-600' : 'text-slate-300'}>|</span>
                 <button onClick={selectNoTenses} className={`hover:underline ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>None</button>
              </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {ALL_TENSES.map(tense => (
              <button
                key={tense}
                onClick={() => toggleTense(tense)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  selectedTenses.includes(tense) 
                    ? (isDarkMode ? 'bg-blue-900/50 text-blue-200 ring-2 ring-blue-600 ring-offset-1 ring-offset-slate-900' : 'bg-blue-100 text-blue-700 ring-2 ring-blue-500 ring-offset-1')
                    : (isDarkMode ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-slate-100 text-slate-500 hover:bg-slate-200')
                }`}
              >
                {tense}
              </button>
            ))}
          </div>
        </div>

        {/* Verbs Selection */}
        <div>
          <div className={`flex flex-col gap-2 mb-3 sticky top-0 z-10 pb-2 transition-colors ${isDarkMode ? 'bg-slate-900' : 'bg-white'}`}>
              <div className="flex justify-between items-end">
                 <label className={`text-sm font-bold uppercase tracking-wide ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    Verbs <span className={`ml-1 text-xs normal-case ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>({selectedVerbs.length} selected)</span>
                 </label>
                 <div className="flex gap-2 text-xs">
                    <button onClick={selectAllVerbs} className={`hover:underline ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>All</button>
                    <span className={isDarkMode ? 'text-slate-600' : 'text-slate-300'}>|</span>
                    <button onClick={selectNoVerbs} className={`hover:underline ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>None</button>
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
                  className={`w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors placeholder:text-slate-400 ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
                />
              </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {verbSearchTerm.trim() === "" ? (
                <div className={`w-full py-8 text-center border-2 border-dashed rounded-xl text-sm ${isDarkMode ? 'border-slate-800 text-slate-500' : 'border-slate-100 text-slate-400'}`}>
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
                        ? (isDarkMode ? 'bg-emerald-900/50 text-emerald-200 ring-2 ring-emerald-600 ring-offset-1 ring-offset-slate-900' : 'bg-emerald-100 text-emerald-700 ring-2 ring-emerald-500 ring-offset-1')
                        : (isDarkMode ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-slate-100 text-slate-500 hover:bg-slate-200')
                    }`}
                  >
                    {verb}
                  </button>
                ))
            )}
            {verbSearchTerm.trim() !== "" && ALL_VERBS.filter(v => v.toLowerCase().includes(verbSearchTerm.toLowerCase())).length === 0 && (
                <p className={`text-xs w-full text-center py-4 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>No verbs found matching "{verbSearchTerm}"</p>
            )}
          </div>
        </div>
      </div>

      <div className={`p-6 border-t ${isDarkMode ? 'border-slate-800 bg-slate-900/50' : 'border-slate-100 bg-slate-50/50'}`}>
        {apiError && (
          <div className={`mb-4 p-3 text-sm rounded-lg flex items-start gap-2 border ${isDarkMode ? 'bg-red-900/30 text-red-300 border-red-800' : 'bg-red-50 text-red-600 border-red-100'}`}>
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <p>{apiError}</p>
          </div>
        )}

        <button 
          onClick={() => handleLoadExercises(false)}
          disabled={isFetching || selectedTenses.length === 0 || selectedVerbs.length === 0}
          className={`w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:cursor-not-allowed text-white rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2 ${isFetching || selectedTenses.length === 0 || selectedVerbs.length === 0 ? (isDarkMode ? 'disabled:bg-slate-700' : 'disabled:bg-slate-300') : ''}`}
        >
          {isFetching ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <Globe size={20} />
          )}
          <span>{isFetching ? "Searching..." : `Start Practice (${batchSize} Sentences)`}</span>
        </button>
      </div>
    </main>
  );

  return (
    // Explicit conditional styling guarantees dark mode works regardless of Tailwind configuration (class vs media)
    <div className={`min-h-screen font-sans flex flex-col items-center py-8 px-4 transition-colors duration-300 ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      {/* Header */}
      <header className="w-full max-w-md flex justify-between items-center mb-8">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 text-white p-2 rounded-lg shadow-sm">
            <BookOpen size={24} />
          </div>
          <div>
            <h1 className={`font-bold text-lg leading-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Verb Master</h1>
            <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Practice English Verbs</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
            <div className="hidden sm:flex gap-3">
              <div className="flex flex-col items-end">
                <span className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Score</span>
                <span className={`font-mono font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>{score}</span>
              </div>
              <div className="flex flex-col items-end">
                  <span className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Racha</span>
                  <div className={`flex items-center gap-1 font-bold ${isDarkMode ? 'text-orange-400' : 'text-orange-500'}`}>
                    <Trophy size={14} />
                    <span>{streak}</span>
                  </div>
              </div>
            </div>

            {/* Dark Mode Toggle */}
            <button 
              onClick={toggleTheme}
              className={`p-2 rounded-full transition-colors ${isDarkMode ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}
              aria-label="Toggle Dark Mode"
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
        </div>
      </header>

      {/* Mobile Stat Bar (Visible only on small screens) */}
      <div className={`sm:hidden w-full max-w-md flex justify-between mb-6 px-4 py-3 rounded-xl shadow-sm border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
            <div className="flex items-center gap-2">
                <span className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Score</span>
                <span className={`font-mono font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>{score}</span>
            </div>
            <div className="flex items-center gap-2">
                <span className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Racha</span>
                <div className={`flex items-center gap-1 font-bold ${isDarkMode ? 'text-orange-400' : 'text-orange-500'}`}>
                  <Trophy size={14} />
                  <span>{streak}</span>
                </div>
            </div>
      </div>

      {/* Main Content Switcher */}
      {view === 'practice' && renderPracticeView()}
      {view === 'settings' && renderSettingsView()}
      {view === 'summary' && renderSummaryView()}

      <div className={`mt-8 text-sm max-w-xs text-center transition-colors ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>
        Created for Spanish speakers learning English. <br/> Data provided by Tatoeba.org
      </div>
    </div>
  );
};

export default ConjugationApp;