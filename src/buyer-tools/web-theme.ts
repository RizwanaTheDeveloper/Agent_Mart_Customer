import { colors } from '../theme';
import fontData from './theme-fonts.json';

const faces = [
  ['AgentMartBody', 400, 'DMSans-Regular.ttf'], ['AgentMartBody', 600, 'DMSans-SemiBold.ttf'],
  ['AgentMartBody', 700, 'DMSans-Bold.ttf'], ['AgentMartHeading', 700, 'Manrope-Bold.ttf'],
  ['AgentMartHeading', 800, 'Manrope-ExtraBold.ttf'],
] as const;

// Presentation only: the APK reference assets and feature behavior stay intact.
export const webTheme = faces.map(([family, weight, file]) => `@font-face{font-family:${family};font-weight:${weight};font-style:normal;src:url(data:font/ttf;base64,${fontData[file]}) format('truetype');font-display:swap}`).join('') + `
  :root{--navy:${colors.deep};--teal:${colors.green};--ink:${colors.ink};--muted:${colors.muted};--line:${colors.line};--bg:${colors.background};--gold:${colors.peach}}
  body{font-family:AgentMartBody,system-ui,sans-serif!important;color:${colors.ink};background:${colors.background}!important}
  h1,h2,h3,h4,.price{font-family:AgentMartHeading,system-ui,sans-serif}
  h1,h2,h3,h4{color:${colors.ink}}a,.textaction,.classicstatus button,.classiccardlinks button,.classicfoot button{color:${colors.green}}
  .hero,.classicintro{background:${colors.sage};color:${colors.green};border-radius:18px}
  .hero h1,.classicintro h1{color:${colors.deep}}.hero p,.classicintro p{color:#526b55}
  .hero .eyebrow,.classicintro .eyebrow,.classicintro em{color:${colors.green}}
  .hero:after,.classicintro:after{border-color:#254b3c08}
  .btn,.chip.active{background:${colors.green};color:white;border-color:${colors.green};border-radius:9px}
  .classicintro .btn{background:${colors.green};color:white}.classicintro .textaction{color:${colors.green}}
  .btn.secondary,.btn.outline,.btn.white{background:white;color:${colors.green};border:1px solid ${colors.line}}
  .btn.danger{color:#a33e3e;background:#fff2ee;border-color:#edc9c0}
  .chip,.panel,details,.classiccard,.marketcard,.interestcard,.interestcounts>div,.classicsearch,input,select,textarea{border-color:${colors.line};border-radius:10px}
  .classiccard,.marketcard,.interestcard{background:white;box-shadow:0 4px 18px #183c3006}
  .classictools>button,.classicdetailtools button,.intereststage,.interestprogress,.bubble.mine{background:${colors.soft};color:${colors.green};border-color:${colors.line}}
  .savefloat,.categoryline,.classiccard .categoryline,.classiccard .price,.classicfoot b{color:${colors.green}}
  .notice.blue{background:#edf2eb;color:#365746;border-color:#d5e1d1}
  .tag.amber{background:#f7e6d8;color:#78543e}.tag.gray{background:#eef1ed;color:#526b55}
  .muted,small,.classiccard .cardbody>small,.classicstatus span,.classicstatus small,.classicfoot,.interestcard p,.interestcard small,.interestcounts small,.sectionhead small{color:${colors.muted}}
  .classiccardlinks{border-color:${colors.line}}input:focus,textarea:focus,select:focus{border-color:#63917d;box-shadow:0 0 0 3px #254b3c12}
  .searchline input{flex:1;min-width:0}.searchline button{flex-shrink:0;white-space:nowrap;min-width:72px}
  button:focus-visible,a:focus-visible{outline:3px solid #d48d5f;outline-offset:3px}
  .rolebadge,.bigavatar,.langsheet43>button.selected{background:${colors.soft};color:${colors.green};border-color:#90ad96}
  .langbackdrop43{background:#183c3080}.langsheet43{box-shadow:0 12px 60px #183c3030}
  .mapbutton,.geodrag44{background:${colors.green};color:white}
`;
