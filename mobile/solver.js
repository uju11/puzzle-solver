/**
 * solver.js — Wend Puzzle Solver (standalone, no browser-extension APIs)
 * Extracted from background.js for use in the mobile PWA.
 */

// ── DICTIONARY ───────────────────────────────────────────────
const WORDS = [
  'ace','act','add','age','ago','aid','aim','air','all','and','ant','any','ape','arc','are','ark','arm','art','ash','ask','ate','awe','axe','aye',
  'bad','bag','ban','bar','bat','bay','bed','bee','bet','bid','big','bin','bit','boa','bog','bow','box','boy','bud','bug','bus','but','buy','bye',
  'cab','can','cap','car','cat','cod','cop','cow','coy','cry','cub','cup','cut',
  'dad','day','den','dew','did','die','dig','dim','dip','dog','dot','dry','dub','due','dug',
  'ear','eat','eel','egg','ego','elf','elm','end','era','err','eve','eye',
  'fan','far','fat','fed','fee','few','fib','fig','fin','fir','fit','fix','fly','foe','fog','for','fox','fry','fun','fur',
  'gag','gap','gas','gay','gel','gem','get','gig','gin','god','got','gum','gun','gut','guy','gym',
  'had','hag','ham','has','hat','hay','hem','hen','her','hid','him','hip','his','hit','hog','hop','hot','how','hub','hue','hug','hum','hut',
  'ice','icy','ill','ink','inn','ion','its','ivy',
  'jab','jam','jar','jaw','jay','jet','job','jog','joy','jug',
  'keg','ken','key','kid','kin','kit',
  'lab','lad','lag','lap','law','lay','led','leg','let','lid','lie','lip','lit','log','lot','low',
  'mad','man','map','mat','may','men','met','mid','mix','mob','mop','mud','mug',
  'nap','net','new','nod','nor','not','now','nut',
  'oak','oar','oat','odd','off','oil','old','one','opt','our','out','owe','owl','own',
  'pad','pal','pan','pat','paw','pay','pea','peg','pen','per','pet','pig','pin','pit','pot','pry','pub','pun','pup','put',
  'rag','ram','ran','rap','rat','raw','ray','red','ref','rep','rib','rid','rig','rim','rip','rob','rod','rot','row','rub','rug','run','rut','rye',
  'sad','sag','sat','saw','say','sea','see','set','sew','shy','sin','sip','sir','sis','sit','six','ski','sky','sly','sob','sod','son','spa','spy','sub','sum','sun',
  'tab','tag','tan','tap','tar','tax','tea','ten','the','tic','tie','tin','tip','toe','ton','too','top','toy','try','tub','tug','two',
  'urn','use',
  'van','vat','vet','via','vie',
  'wad','wag','war','was','wax','way','web','wed','wee','wet','who','why','wig','win','wit','woe','won','woo',
  'yes','yet','you',
  'zap','zip','zoo',
  'able','acid','aged','aide','also','arch','area','arts','atom',
  'back','bake','ball','band','bank','bare','bark','base','bath','beam','bean','bear','beat','been','bell','belt','bend','best','bike','bird','bite','blow','blue','boat','body','boil','bold','bolt','bone','book','boom','boot','born','bowl','brew','buck','bulb','bulk','burn','bury','bush','busy',
  'cafe','cage','cake','call','came','camp','card','care','case','cast','cell','chat','chin','chop','city','clap','clay','clip','club','coal','coat','code','coin','cold','come','cook','cool','cope','copy','cord','core','corn','cost','crab','crew','crop','cube','curb','cure','curl','cute',
  'damp','dare','dark','date','dawn','dead','deaf','deal','dean','dear','deck','deed','deep','deer','demo','deny','desk','dial','dice','diet','dime','dine','dire','dirt','disc','dish','dive','dock','does','done','door','dose','dove','down','drag','dram','draw','drew','drip','drop','drug','drum','dual','dude','duke','dull','dump','dune','dunk','dusk','dust',
  'each','earl','earn','ease','east','easy','echo','edge','edit','else','emit','epic','euro','even','ever','evil','exam','exit',
  'face','fact','fade','fail','fair','fake','fall','fame','fare','farm','fast','fate','fear','feat','feed','feel','feet','fell','felt','fern','file','fill','film','find','fine','fire','firm','fish','five','flag','flat','fled','flee','flew','flip','flow','foam','fold','folk','fond','font','food','fool','foot','fork','form','fort','foul','four','free','from','fuel','full','fund','fuse',
  'gain','game','gang','gate','gave','gear','gene','gift','girl','give','glad','glue','goal','goat','goes','gold','golf','gone','good','grab','gram','gray','grew','grey','grid','grin','grip','grow','gulf','gust',
  'hack','hair','half','hall','hand','hang','hard','hare','harm','hate','have','hawk','head','heal','heap','hear','heat','heed','heel','held','hell','help','herb','herd','here','hero','hide','high','hike','hill','hint','hire','hole','holy','home','hood','hook','hope','horn','host','hour','huge','hung','hunt','hurt',
  'idea','idle','inch','info','iron',
  'jack','jail','junk','jury',
  'keen','keep','kept','kick','kill','kind','king','kiss','knee','knew','knot','know',
  'lack','lady','laid','lake','lamb','lame','land','lane','last','late','lead','leaf','leak','lean','leap','left','lend','lens','less','liar','life','lift','like','line','link','lion','list','live','load','loaf','loan','lock','loft','lone','long','look','loop','lord','lose','loss','lost','loud','love','luck','lump','lung','lure','lust',
  'maid','mail','main','make','male','mall','many','mark','mask','mass','math','meal','mean','meat','meet','melt','memo','menu','mess','mice','mild','mile','milk','mill','mind','mine','mint','miss','mist','mode','mood','moon','more','moss','moth','move','much','mule','must',
  'nail','name','navy','near','neat','neck','need','nest','news','next','nice','nick','noun','nose','note',
  'oath','obey','odds','oven','over',
  'pace','pack','page','paid','pail','pain','pair','pale','palm','park','part','pass','path','pave','peak','peel','peer','pest','pick','pile','pill','pine','pink','pint','pipe','plan','play','plea','plot','plug','poem','poet','pole','poll','pond','pony','pool','poor','pope','pork','port','pose','post','pour','pray','prep','prey','pull','pulp','pump','pure','push',
  'quit','quiz',
  'race','rack','rage','raid','rail','rain','rake','rank','rare','rate','read','real','reap','rear','rely','rent','rest','rice','rich','ride','ring','riot','ripe','rise','risk','road','roam','roar','robe','rock','rode','role','roll','roof','room','root','rope','rose','rude','ruin','rule','rung','rush','rust',
  'safe','sage','said','sail','sake','sale','salt','same','sand','sane','sang','sank','save','seal','seam','seat','seed','seek','seem','seen','self','sell','send','sent','shed','ship','shoe','shop','shot','show','shut','sick','side','sigh','sign','silk','sing','sink','site','size','skip','slab','slam','slap','sled','slip','slow','slug','snap','snow','soap','soar','sock','soda','soft','soil','sold','sole','some','song','soon','sore','sort','soul','soup','span','spin','spot','stab','stag','star','stay','stem','step','stew','stir','stop','such','suit','sure','swap','swim',
  'tail','take','tale','talk','tall','tank','tape','task','team','tear','teen','tell','tend','tent','term','test','text','than','that','thee','them','then','they','thin','this','tick','tide','tidy','tied','tier','tile','till','tilt','time','tiny','tire','toad','toes','told','toll','tone','took','tool','tore','torn','toss','tour','town','trap','tray','tree','trek','trim','trio','trip','trot','true','tube','tune','twin','type',
  'ugly','unit','upon','used','user',
  'vain','vale','vary','vase','vast','verb','very','vice','view','vine','visa','void','vote',
  'wade','wage','wait','wake','walk','wall','want','ward','warm','warn','wash','wasp','wave','weak','wear','week','weep','well','went','were','west','what','when','whom','wide','wife','wild','will','wind','wine','wing','wink','wise','wish','with','wolf','womb','wood','wool','word','wore','work','worm','worn','wrap','wren',
  'yard','yarn','year','yell','yoga','yoke','your',
  'zone',
  'about','above','abuse','acute','admit','adopt','adult','after','again','agent','agree','ahead','alarm','album','alert','alien','align','alike','allow','alone','along','alter','angel','anger','angle','ankle','apart','apple','apply','arena','argue','arise','armed','armor','array','arrow','aside','asset','avoid','awake','award','aware',
  'baker','basis','beast','began','begin','being','below','bench','birth','black','blade','blame','blank','blast','bleed','bless','blind','block','blood','blown','board','boost','booth','bound','brain','brand','brass','brave','bread','break','breed','brick','bride','brief','bring','broad','broke','brown','build','built','burst',
  'cable','cargo','carry','carve','catch','cause','chain','chair','chalk','charm','chart','chase','cheap','cheat','check','cheek','cheer','chest','chief','child','choir','chose','civic','claim','clash','class','clean','clear','click','cliff','climb','clock','clone','close','cloth','cloud','clown','coach','coast','colon','color','comic','couch','cough','could','count','court','cover','crack','craft','crash','crazy','cream','creed','creek','crime','crisp','crook','cross','crowd','crown','crude','crush','curve','cycle',
  'daily','dance','dealt','death','debut','delay','dense','depth','derby','deter','diary','dirty','disco','diver','dodge','doing','doubt','dough','dozen','draft','drama','drawn','dream','dress','dried','drift','drink','drive','drown','dunce',
  'eager','early','earth','eight','elbow','elder','elite','empty','enemy','enjoy','enter','entry','equal','error','essay','event','every','exact','exile','exist','extra',
  'faint','fairy','faith','false','fancy','fatal','fault','favor','feast','fence','ferry','fetch','fever','field','fiery','fifth','fifty','fight','final','first','fixed','flame','flash','fleet','flesh','flood','floor','flour','fluid','flush','focus','force','forge','frame','fraud','freak','fresh','front','frost','fruit','fully','funny',
  'games','genre','ghost','giant','given','gland','glass','gleam','glide','globe','gloom','glory','glove','grace','grade','grain','grant','grape','grass','grate','grave','great','greed','green','greet','grief','grill','groan','groom','gross','group','grove','grown','guard','guess','guest','guide','guild','guilt',
  'habit','hairy','handy','happy','hardy','harsh','haste','hasty','hatch','haunt','havoc','haven','heads','heard','heart','heavy','hedge','heels','hefty','hello','hence','herbs','heron','hobby','holds','holly','homes','hooks','horse','house','hover','human','humid','humor','hurry',
  'icons','ideal','idiom','issue',
  'jeans','joint','jolly','judge','juice','jumbo',
  'karma','keeps','kicks','kills','kinds','kings','knack','knead','knife','knock','knots','known',
  'label','labor','lance','lands','lanes','large','laugh','layer','leads','leafy','lease','leash','least','leave','legal','level','light','liked','limit','lined','linen','liner','lives','loads','local','lodge','lofty','logic','loins','loose','lower','lowly','loyal','lucky','lucid','lunch','lunge',
  'magic','major','maker','manor','march','match','mayor','media','mercy','merit','metal','might','minor','model','money','month','moral','motor','motto','mount','mouse','mouth','music',
  'naive','nerve','never','night','noble','noise','north','noted','novel','nurse',
  'occur','ocean','offer','often','olive','onset','order','organ','other','ought','outer','owner',
  'paint','panel','paper','party','pause','peace','pearl','penal','penny','phase','phone','photo','piano','piece','pilot','pitch','pixel','pizza','place','plain','plane','plant','plate','plaza','plead','pluck','plume','poise','polar','porch','pound','power','press','price','pride','prime','print','prism','prize','probe','prone','proof','prose','proud','prove','prowl','psalm','pulse','purer','purse','puzzle',
  'queen','quest','queue','quiet','quite',
  'radar','radio','raise','rally','range','rapid','ratio','reach','ready','realm','rebel','refer','reign','relax','repay','repel','rider','ridge','rifle','rigid','risky','rival','river','robin','rocky','rouge','rough','round','route','royal','rugby','ruler',
  'sadly','saint','salad','scale','scare','scene','scent','scope','score','scout','seize','sense','serve','setup','seven','shade','shake','shall','shame','shape','share','shark','sharp','shear','sheet','shelf','shell','shift','shock','shoot','shore','short','shout','since','sixth','sixty','skill','slate','slave','sleep','sleet','slice','slide','slope','smart','smell','smile','smoke','solid','solve','sorry','south','space','spare','spark','spawn','speed','spell','spend','spike','spine','split','spoke','spore','sport','spray','squad','squat','stack','staff','stage','stain','stake','stale','stand','stark','start','state','stave','steam','steel','steep','steer','stern','stick','stiff','still','stock','stole','stone','stood','store','storm','story','stout','stove','straw','stray','strip','strum','stuck','study','stuff','style','sugar','suite','sulky','sunny','super','surge','swamp','swear','sweat','sweep','sweet','swift','swirl','sword',
  'table','taken','taste','taxes','teach','teeth','tense','terms','thank','theme','there','these','thick','thing','think','those','three','threw','throw','thumb','tidal','tiger','tight','timer','tired','title','today','token','touch','tough','towel','tower','toxic','trace','track','trade','trail','train','trait','tramp','trash','treat','trend','trial','tribe','trick','tried','troop','truck','truly','trust','truth','tumor','tweak','twice','twist',
  'ulcer','under','union','until','upper','upset','urban','usher',
  'valid','valor','value','valve','video','vigor','viral','virus','visit','vital','vivid','vocal','vodka',
  'wagon','waste','watch','water','weary','weave','wedge','weigh','weird','whale','wheat','wheel','where','which','while','white','whole','whose','wield','wince','witch','witty','woman','women','wrath','write','wrote','young',
  'abrupt','absent','absorb','accent','accept','access','action','active','actual','adjust','admire','advise','affect','afford','afraid','agency','agenda','almost','always','amount','annual','answer','appear','around','artist','aspire','assure','attain','attend',
  'banter','battle','beauty','beckon','before','behalf','behave','behind','belief','belong','beside','beware','bitter','bounce','breach','breeze','bridge','bright','broken','brutal','bubble','burden','bustle',
  'candid','cannot','castle','casual','caught','cavern','center','charge','chosen','circle','clever','combat','common','comply','confer','corner','course','cousin','create','credit','crisis','critic','custom',
  'damage','danger','dangle','dazzle','decent','decide','defend','demand','dental','desert','design','desire','detail','devote','differ','direct','domain','double','driven','during',
  'easily','effect','either','emerge','empire','enable','endure','engage','ensure','entire','escape','except','expect','expose','extend','extent',
  'fallen','famous','fasten','father','fierce','figure','finger','finish','fiscal','forest','formal','foster','frozen','future',
  'gentle','global','govern','growth','guided',
  'happen','health','hearty','height','heroic','hidden','highly','honest','horror','humble',
  'ignite','impact','impose','income','indeed','infant','inform','injury','insect','insure','intend','invest','invite','island',
  'joyful','junior',
  'keeper','killer',
  'leader','lessen','letter','little','lively','lonely','lovely','luxury',
  'madden','manage','margin','market','master','matter','meadow','medium','mental','method','middle','mighty','modest','moment','mostly','mother','motion','motive','muscle','mutual','mystic',
  'narrow','nation','nature','nearby','normal','notice',
  'object','obtain','office','oppose','option','orange','origin','output',
  'parish','pardon','patent','patrol','patron','people','period','permit','person','planet','please','pledge','plenty','pocket','polish','public','purple','pursue',
  'racket','random','rarely','rather','reason','recent','reduce','relief','remain','remote','repair','repeat','rescue','result','return','reveal','review','reward','riddle','rising','robust','rotate','rotten','rubber',
  'sadden','safety','sample','search','season','second','secret','seldom','select','senior','settle','silent','silver','simple','single','sister','sleepy','slight','smooth','soften','source','spirit','spoken','spread','spring','square','stable','string','strong','struck','stupid','sudden','suffer','summer','supply','surely','survey','switch','symbol',
  'talent','target','tender','theory','tissue','tongue','toward','travel','tunnel',
  'unfold','unique','unlock','update','uphold','urgent',
  'vendor','victim','virtue','visual','volume',
  'wander','warden','warmth','wealth','weight','wholly','wisdom','wither','wonder','worthy',
  'abandon','ability','absence','achieve','acquire','address','advance','adverse','against','arrange','attempt','attract',
  'balance','because','becomes','between','blunder','briefly','brought',
  'cabinet','capture','careful','ceiling','century','certain','channel','chapter','charity','chimney','citizen','classic','climate','cluster','collect','command','complex','concern','context','control','convert','convict','counsel','counter','country','crucial','culture',
  'dealing','decided','defense','destiny','develop','devoted','digital','display','distant','diverse','drawing','dynamic',
  'economy','example','exclaim','excited','explore','extreme',
  'feature','feeling','fiction','freedom','foreign','forward','funding',
  'genuine','glitter','glimpse','goddess','gradual','grammar','gravity','greatly',
  'harmony','healthy','hearing','herself','highest','himself','history','holding','hundred',
  'imagine','improve','include','instant','instead','involve',
  'journey','justice',
  'keeping','knowing','kingdom',
  'largely','leading','learned','liberty','lengthy','logical',
  'marshal','meeting','mention','miracle','missing','mission','mixture','monster','morning','mystery',
  'nothing','nowhere',
  'officer','operate','opinion','outcome','outside','overall',
  'package','partner','pattern','percent','perfect','perform','perhaps','picture','playing','popular','portion','poverty','present','prevent','primary','private','problem','process','product','program','project','promise','provide','purpose',
  'quality','quarter','quickly','quietly',
  'rapidly','reading','reality','recover','replace','require','reserve','resolve','respect','respond','results','returns','reunion','robbery',
  'satisfy','scandal','section','serious','service','setting','similar','society','somehow','someone','shortly','silence','silicon','special','station','strange','stretch','subject','suburbs','succeed','surface','sustain','symptom','systems',
  'teacher','testing','through','tonight','totally','tourist','tragedy','trouble','turning',
  'usually',
  'variety','vehicle','venture','version','village','violent',
  'welcome','western','whereas','without','worried','worship',
  'breakfast','afternoon','overnight','birthday','childhood','adulthood','knowledge',
  'accomplish','advertisement','approximately','breakthrough','circumstance','communication','concentration',
  'determination','establishment','extraordinary','implementation','infrastructure','international','investigation',
  'participation','recommendation','reconciliation','representation','responsibility','transformation','transportation',
];

const WORD_DICTIONARY = new Set(WORDS.map(w => w.toLowerCase()));
const PREFIX_SET = new Set();
for (const w of WORD_DICTIONARY) {
  for (let i = 1; i < w.length; i++) PREFIX_SET.add(w.slice(0, i));
}

// Extended dictionary loader (370k words)
let _extDictLoaded = false;
let _extDictPromise = null;

async function loadExtendedDictionary(onProgress) {
  if (_extDictLoaded) return;
  if (!_extDictPromise) {
    _extDictPromise = (async () => {
      try {
        if (onProgress) onProgress('Downloading extended dictionary...');
        const res = await fetch('https://raw.githubusercontent.com/dwyl/english-words/master/words_alpha.txt');
        const text = await res.text();
        const words = text.split(/\r?\n/).map(w => w.trim().toLowerCase());
        let added = 0;
        for (const w of words) {
          if (w.length >= 3 && w.length <= 15 && !WORD_DICTIONARY.has(w)) {
            WORD_DICTIONARY.add(w);
            added++;
          }
        }
        PREFIX_SET.clear();
        for (const w of WORD_DICTIONARY) {
          for (let i = 1; i < w.length; i++) PREFIX_SET.add(w.slice(0, i));
        }
        _extDictLoaded = true;
        if (onProgress) onProgress(`Extended dictionary: +${added} words`);
      } catch (e) {
        console.warn('Extended dict load failed:', e);
      }
    })();
  }
  return _extDictPromise;
}

// ── HELPERS ─────────────────────────────────────────────────
function neighbors(grid, r, c) {
  const result = [];
  for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
    const nr = r + dr, nc = c + dc;
    if (nr >= 0 && nr < grid.length && nc >= 0 && nc < grid[nr].length && grid[nr][nc] !== '#')
      result.push([nr, nc]);
  }
  return result;
}

// ── FREE SOLVER ──────────────────────────────────────────────
function solveFree(grid) {
  const rows = grid.length, cols = grid[0].length;
  const solutions = [];
  const seen = new Set();
  const visited = new Set();

  function dfs(r, c, word, path, targetLen) {
    const k = `${r},${c}`;
    if (visited.has(k)) return;
    const ch = grid[r]?.[c];
    if (!ch || ch === '#' || ch === '?') return;
    visited.add(k);
    const newWord = word + ch.toLowerCase();
    path.push([r, c]);
    if (newWord.length === targetLen) {
      if (WORD_DICTIONARY.has(newWord) && !seen.has(newWord)) {
        seen.add(newWord);
        solutions.push({ word: newWord, path: [...path] });
      }
    } else if (PREFIX_SET.has(newWord)) {
      for (const [nr, nc] of neighbors(grid, r, c)) dfs(nr, nc, newWord, path, targetLen);
    }
    path.pop();
    visited.delete(k);
  }

  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      if (grid[r][c] !== '#' && grid[r][c] !== '?')
        for (let len = 3; len <= 10; len++) dfs(r, c, '', [], len);

  return solutions.sort((a, b) => b.word.length - a.word.length || a.word.localeCompare(b.word));
}

// ── WEND SOLVER (exact — covers ALL cells) ───────────────────
function solveWend(grid, wordLengths) {
  const rows = grid.length, cols = grid[0].length;
  let validCount = 0;
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      if (grid[r][c] !== '#') validCount++;

  const totalLen = wordLengths.reduce((a, b) => a + b, 0);
  if (totalLen !== validCount)
    return { error: `Word lengths sum to ${totalLen} but grid has ${validCount} valid cells.` };

  const lengths = [...wordLengths].sort((a, b) => b - a);
  const used = Array.from({ length: rows }, () => new Array(cols).fill(false));
  const solutions = [];
  const words = [];

  function dfsWord(r, c, word, path, targetLen, lenIdx) {
    if (solutions.length >= 5) return;
    if (word.length === targetLen) {
      if (WORD_DICTIONARY.has(word)) {
        words.push({ word, path: path.map(p => [...p]) });
        backtrack(lenIdx + 1);
        words.pop();
      }
      return;
    }
    if (!PREFIX_SET.has(word)) return;
    for (const [nr, nc] of neighbors(grid, r, c)) {
      if (!used[nr][nc]) {
        used[nr][nc] = true;
        path.push([nr, nc]);
        const ch = grid[nr][nc];
        if (ch === '?') {
          for (let i = 0; i < 26; i++) {
            dfsWord(nr, nc, word + String.fromCharCode(97 + i), path, targetLen, lenIdx);
            if (solutions.length >= 5) break;
          }
        } else {
          dfsWord(nr, nc, word + ch.toLowerCase(), path, targetLen, lenIdx);
        }
        path.pop();
        used[nr][nc] = false;
        if (solutions.length >= 5) return;
      }
    }
  }

  function backtrack(lenIdx) {
    if (solutions.length >= 5) return;
    if (lenIdx === lengths.length) {
      for (let r = 0; r < rows; r++)
        for (let c = 0; c < cols; c++)
          if (grid[r][c] !== '#' && !used[r][c]) return;
      solutions.push(words.map(w => ({ word: w.word, path: w.path })));
      return;
    }
    const targetLen = lengths[lenIdx];
    let minFree = Infinity, unusedCount = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (!used[r][c] && grid[r][c] !== '#') {
          unusedCount++;
          let free = 0;
          for (const [nr, nc] of neighbors(grid, r, c)) if (!used[nr][nc]) free++;
          if (free < minFree) minFree = free;
        }
      }
    }
    if (unusedCount > 0 && minFree === 0 && targetLen > 1) return;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (!used[r][c] && grid[r][c] !== '#') {
          used[r][c] = true;
          const ch = grid[r][c];
          if (ch === '?') {
            for (let i = 0; i < 26 && solutions.length < 5; i++)
              dfsWord(r, c, String.fromCharCode(97 + i), [[r, c]], targetLen, lenIdx);
          } else {
            dfsWord(r, c, ch.toLowerCase(), [[r, c]], targetLen, lenIdx);
          }
          used[r][c] = false;
          if (solutions.length >= 5) return;
        }
      }
    }
  }

  backtrack(0);
  return solutions;
}
