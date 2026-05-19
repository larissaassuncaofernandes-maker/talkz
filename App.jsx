import { useState, useEffect, useRef } from "react";
import { initializeApp, getApps } from "firebase/app";
import {
  getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  onAuthStateChanged, signOut
} from "firebase/auth";
import {
  getFirestore, collection, doc, getDoc, setDoc, addDoc,
  onSnapshot, query, where, orderBy, serverTimestamp
} from "firebase/firestore";
import {
  getStorage, ref, uploadBytes, getDownloadURL
} from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAoEwXIrGOY3dB6ib6kdIKsbpgiIPukSJE",
  authDomain: "talkz-brazilog.firebaseapp.com",
  projectId: "talkz-brazilog",
  storageBucket: "talkz-brazilog.firebasestorage.app",
  messagingSenderId: "276247334647",
  appId: "1:276247334647:web:cb6e4e06459df524c54df2"
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

const G = {
  bg: "#111b21", panel: "#202c33", hover: "#2a3942", border: "#374045",
  green: "#00a884", greenDark: "#005c4b",
  sent: "#005c4b", received: "#202c33",
  text: "#e9edef", textSub: "#8696a0", textMuted: "#667781",
  red: "#f15c6d", yellow: "#ffd166", blue: "#53bdeb", white: "#ffffff",
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Nunito',sans-serif;background:${G.bg};color:${G.text};height:100vh;overflow:hidden}
  ::-webkit-scrollbar{width:6px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:${G.border};border-radius:3px}
  input,textarea,button,select{font-family:inherit}button{cursor:pointer;border:none;outline:none}input,textarea{outline:none;border:none;background:transparent}
  .fade-in{animation:fadeIn .25s ease}@keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
  .slide-in{animation:slideIn .2s ease}@keyframes slideIn{from{opacity:0;transform:translateX(-10px)}to{opacity:1;transform:none}}
  .spin{animation:spin 1s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}
`;

const Avatar = ({ label, size = 40, color = G.green, style = {} }) => (
  <div style={{ width:size,height:size,borderRadius:"50%",background:color,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:size*.35,color:G.white,flexShrink:0,...style }}>{label}</div>
);
const StatusDot = ({ status }) => {
  const c = { online:G.green, away:G.yellow, offline:G.textMuted };
  return <div style={{ width:10,height:10,borderRadius:"50%",background:c[status]||G.textMuted,border:`2px solid ${G.panel}`,position:"absolute",bottom:1,right:1 }} />;
};
const RoleBadge = ({ role }) => {
  const m = { admin:["Admin",G.green],interno:["Interno",G.blue],externo:["Cliente",G.yellow],operador:["Operador","#a29bfe"] };
  const [label,color] = m[role]||["?",G.textMuted];
  return <span style={{ fontSize:10,fontWeight:700,color,background:color+"22",borderRadius:4,padding:"1px 6px",marginLeft:6 }}>{label}</span>;
};
const Spinner = ({size=20}) => <div className="spin" style={{ width:size,height:size,border:`3px solid ${G.border}`,borderTop:`3px solid ${G.green}`,borderRadius:"50%",flexShrink:0 }} />;

const Icon = ({ name, size=20, color=G.textSub }) => {
  const i = {
    search:<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>,
    send:<svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>,
    attach:<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/></svg>,
    plus:<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
    check:<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>,
    bell:<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>,
    close:<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
    logout:<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
    settings:<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>,
  };
  return i[name]||null;
};

const LoadingScreen = ({ msg="Carregando..." }) => (
  <div style={{ height:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:G.bg,gap:16 }}>
    <style>{css}</style>
    <div style={{ width:64,height:64,borderRadius:"50%",background:`linear-gradient(135deg,${G.green},${G.greenDark})`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 8px 24px ${G.green}44` }}>
      <svg width="32" height="32" viewBox="0 0 24 24" fill="white"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
    </div>
    <div style={{ fontSize:22,fontWeight:800,color:G.text }}>Talkz</div>
    <Spinner />
    <div style={{ fontSize:13,color:G.textSub }}>{msg}</div>
  </div>
);

const LoginScreen = ({ onLogin }) => {
  const [email,setEmail]=useState(""); const [pass,setPass]=useState("");
  const [err,setErr]=useState(""); const [loading,setLoading]=useState(false);

  const handle = async () => {
    if(!email||!pass){setErr("Preencha e-mail e senha.");return;}
    setLoading(true);setErr("");
    try {
      const cred = await signInWithEmailAndPassword(auth, email, pass);
      const snap = await getDoc(doc(db,"users",cred.user.uid));
      onLogin(snap.exists() ? {uid:cred.user.uid,...snap.data()} : {uid:cred.user.uid,email:cred.user.email,name:email,role:"interno",avatar:email.slice(0,2).toUpperCase()});
    } catch(e) {
      const m={
        "auth/user-not-found":"Usuário não encontrado.",
        "auth/wrong-password":"Senha incorreta.",
        "auth/invalid-credential":"E-mail ou senha incorretos.",
        "auth/too-many-requests":"Muitas tentativas. Aguarde.",
      };
      setErr(m[e.code]||"Erro: "+e.message);
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:G.bg,backgroundImage:`radial-gradient(ellipse at 60% 20%,${G.green}18 0%,transparent 60%)` }}>
      <style>{css}</style>
      <div className="fade-in" style={{ background:G.panel,borderRadius:20,padding:"48px 40px",width:380,boxShadow:"0 20px 60px #0008" }}>
        <div style={{ textAlign:"center",marginBottom:36 }}>
          <div style={{ width:72,height:72,borderRadius:"50%",background:`linear-gradient(135deg,${G.green},${G.greenDark})`,margin:"0 auto 16px",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 8px 24px ${G.green}44` }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="white"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
          </div>
          <div style={{ fontSize:28,fontWeight:800,color:G.text,letterSpacing:-1 }}>Talkz</div>
          <div style={{ fontSize:13,color:G.textSub,marginTop:4 }}>Brazilog · Comunicação logística</div>
        </div>
        <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
          {[["E-MAIL",email,setEmail,"seu@email.com","email"],["SENHA",pass,setPass,"••••••••","password"]].map(([lbl,val,set,ph,type])=>(
            <div key={lbl} style={{ background:G.bg,borderRadius:10,padding:"12px 16px",border:`1.5px solid ${G.border}` }}>
              <div style={{ fontSize:11,color:G.textSub,marginBottom:4 }}>{lbl}</div>
              <input type={type} value={val} onChange={e=>{set(e.target.value);setErr("");}} placeholder={ph} onKeyDown={e=>e.key==="Enter"&&handle()} style={{ color:G.text,fontSize:15,width:"100%" }} />
            </div>
          ))}
          {err&&<div style={{ color:G.red,fontSize:12,textAlign:"center",background:G.red+"18",borderRadius:8,padding:"8px 12px" }}>{err}</div>}
          <button onClick={handle} disabled={loading} style={{ background:`linear-gradient(135deg,${G.green},${G.greenDark})`,color:G.white,borderRadius:10,padding:"14px",fontSize:15,fontWeight:700,marginTop:4,boxShadow:`0 4px 16px ${G.green}44`,display:"flex",alignItems:"center",justifyContent:"center",gap:8,opacity:loading?.7:1 }}>
            {loading?<><Spinner size={18}/>Entrando...</>:"Entrar no Talkz"}
          </button>
        </div>
        <div style={{ marginTop:20,textAlign:"center",fontSize:12,color:G.textMuted }}>Acesso fornecido pelo administrador</div>
      </div>
    </div>
  );
};

export default function TalkzApp() {
  const [currentUser,setCurrentUser]=useState(null);
  const [fbReady,setFbReady]=useState(false);
  const [contacts,setContacts]=useState([]);
  const [groups,setGroups]=useState([]);
  const [activeChat,setActiveChat]=useState(null);
  const [messages,setMessages]=useState([]);
  const [input,setInput]=useState("");
  const [search,setSearch]=useState("");
  const [tab,setTab]=useState("chats");
  const [showAdmin,setShowAdmin]=useState(false);
  const [showAddUser,setShowAddUser]=useState(false);
  const [newOccurrence,setNewOccurrence]=useState(false);
  const [occurrences,setOccurrences]=useState([]);
  const [loadingMsgs,setLoadingMsgs]=useState(false);
  const msgEndRef=useRef(null);
  const unsubRef=useRef(null);

  useEffect(()=>{
    const unsub = onAuthStateChanged(auth, async user=>{
      if(user){
        const snap=await getDoc(doc(db,"users",user.uid));
        setCurrentUser(snap.exists()?{uid:user.uid,...snap.data()}:{uid:user.uid,email:user.email,name:user.email,role:"interno",avatar:user.email.slice(0,2).toUpperCase()});
      } else {
        setCurrentUser(null);
      }
      setFbReady(true);
    });
    return ()=>unsub();
  },[]);

  useEffect(()=>{
    if(!currentUser) return;
    const u1=onSnapshot(collection(db,"users"),s=>setContacts(s.docs.map(d=>({id:d.id,...d.data()})).filter(u=>u.id!==currentUser.uid)));
    const u2=onSnapshot(query(collection(db,"groups"),where("members","array-contains",currentUser.uid)),s=>setGroups(s.docs.map(d=>({id:d.id,type:"group",...d.data()}))));
    const u3=onSnapshot(query(collection(db,"occurrences"),orderBy("createdAt","desc")),s=>setOccurrences(s.docs.map(d=>({id:d.id,...d.data()}))));
    return()=>{u1();u2();u3();};
  },[currentUser]);

  useEffect(()=>{
    if(!activeChat) return;
    if(unsubRef.current) unsubRef.current();
    setLoadingMsgs(true); setMessages([]);
    const chatId=getChatId(activeChat);
    unsubRef.current=onSnapshot(
      query(collection(db,"chats",chatId,"messages"),orderBy("createdAt","asc")),
      s=>{ setMessages(s.docs.map(d=>({id:d.id,...d.data()}))); setLoadingMsgs(false); }
    );
  },[activeChat]);

  useEffect(()=>{ msgEndRef.current?.scrollIntoView({behavior:"smooth"}); },[messages]);

  const getChatId = chat => chat.type==="group" ? `group_${chat.id}` : `dm_${[currentUser.uid,chat.id].sort().join("_")}`;

  const sendMessage = async () => {
    if(!input.trim()||!activeChat) return;
    const text=input.trim(); setInput("");
    const chatId=getChatId(activeChat);
    await addDoc(collection(db,"chats",chatId,"messages"),{text,from:currentUser.uid,fromName:currentUser.name,createdAt:serverTimestamp(),type:"text"});
    await setDoc(doc(db,"chats",chatId),{lastMessage:text,lastTime:serverTimestamp(),participants:activeChat.type==="group"?activeChat.members:[currentUser.uid,activeChat.id]},{merge:true});
  };

  const sendFile = async file => {
    if(!file||!activeChat) return;
    const chatId=getChatId(activeChat);
    const storageRef=ref(storage,`chats/${chatId}/${Date.now()}_${file.name}`);
    await uploadBytes(storageRef,file);
    const url=await getDownloadURL(storageRef);
    const isImg=file.type.startsWith("image/");
    await addDoc(collection(db,"chats",chatId,"messages"),{text:isImg?"":file.name,fileUrl:url,fileName:file.name,from:currentUser.uid,fromName:currentUser.name,createdAt:serverTimestamp(),type:isImg?"image":"file"});
  };

  if(!fbReady) return <LoadingScreen msg="Conectando..." />;
  if(!currentUser) return <LoginScreen onLogin={setCurrentUser} />;

  const allItems=[...contacts,...groups];
  const filtered=allItems.filter(c=>c.name?.toLowerCase().includes(search.toLowerCase()));
  const tabList=tab==="chats"?filtered.filter(c=>c.type!=="group"):tab==="grupos"?filtered.filter(c=>c.type==="group"):[];
  const priColor={alta:G.red,media:G.yellow,baixa:G.green};
  const stColor={aberto:G.red,"em andamento":G.yellow,resolvido:G.green};

  const AddUserModal = ()=>{
    const [form,setForm]=useState({name:"",email:"",pass:"",role:"interno",dept:""});
    const [saving,setSaving]=useState(false); const [err,setErr]=useState("");
    const save=async()=>{
      if(!form.name||!form.email||!form.pass){setErr("Preencha todos os campos.");return;}
      setSaving(true);setErr("");
      try{
        const cred=await createUserWithEmailAndPassword(auth,form.email,form.pass);
        const initials=form.name.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase();
        await setDoc(doc(db,"users",cred.user.uid),{name:form.name,email:form.email,role:form.role,dept:form.dept,avatar:initials,status:"offline"});
        setShowAddUser(false);
      }catch(e){setErr(e.message);}
      setSaving(false);
    };
    return(
      <div style={{ position:"fixed",inset:0,background:"#000a",display:"flex",alignItems:"center",justifyContent:"center",zIndex:300 }}>
        <div className="fade-in" style={{ background:G.panel,borderRadius:16,padding:28,width:380,boxShadow:"0 20px 60px #0008" }}>
          <div style={{ display:"flex",justifyContent:"space-between",marginBottom:20 }}>
            <div style={{ fontSize:16,fontWeight:800 }}>Novo Usuário</div>
            <button onClick={()=>setShowAddUser(false)} style={{ background:"transparent" }}><Icon name="close" size={18} color={G.textSub}/></button>
          </div>
          <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
            {[["Nome completo","name","text"],["E-mail","email","email"],["Senha inicial","pass","password"],["Setor / Empresa","dept","text"]].map(([ph,k,t])=>(
              <input key={k} type={t} placeholder={ph} value={form[k]} onChange={e=>setForm(p=>({...p,[k]:e.target.value}))}
                style={{ background:G.bg,borderRadius:8,padding:"10px 14px",color:G.text,fontSize:14,border:`1px solid ${G.border}` }} />
            ))}
            <select value={form.role} onChange={e=>setForm(p=>({...p,role:e.target.value}))}
              style={{ background:G.bg,borderRadius:8,padding:"10px 14px",color:G.text,fontSize:14,border:`1px solid ${G.border}` }}>
              <option value="interno">Interno</option>
              <option value="externo">Cliente Externo</option>
              <option value="operador">Operador / Motorista</option>
              <option value="admin">Admin</option>
            </select>
            {err&&<div style={{ color:G.red,fontSize:12,background:G.red+"18",borderRadius:8,padding:"8px 12px" }}>{err}</div>}
            <button onClick={save} disabled={saving} style={{ background:`linear-gradient(135deg,${G.green},${G.greenDark})`,color:G.white,borderRadius:10,padding:"12px",fontSize:14,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",gap:8 }}>
              {saving?<><Spinner size={16}/>Criando...</>:"Criar Usuário"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const OccurrenceModal = ()=>{
    const [form,setForm]=useState({title:"",priority:"media",desc:""});
    const [saving,setSaving]=useState(false);
    const save=async()=>{
      if(!form.title) return;
      setSaving(true);
      await addDoc(collection(db,"occurrences"),{...form,status:"aberto",from:currentUser.name,fromId:currentUser.uid,createdAt:serverTimestamp()});
      setNewOccurrence(false); setSaving(false);
    };
    return(
      <div style={{ position:"fixed",inset:0,background:"#000a",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200 }}>
        <div className="fade-in" style={{ background:G.panel,borderRadius:16,padding:28,width:380,boxShadow:"0 20px 60px #0008" }}>
          <div style={{ display:"flex",justifyContent:"space-between",marginBottom:20 }}>
            <div style={{ fontSize:16,fontWeight:800 }}>Nova Ocorrência</div>
            <button onClick={()=>setNewOccurrence(false)} style={{ background:"transparent" }}><Icon name="close" size={18} color={G.textSub}/></button>
          </div>
          <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
            <input value={form.title} onChange={e=>setForm(p=>({...p,title:e.target.value}))} placeholder="Título"
              style={{ background:G.bg,borderRadius:8,padding:"10px 14px",color:G.text,fontSize:14,border:`1px solid ${G.border}` }} />
            <select value={form.priority} onChange={e=>setForm(p=>({...p,priority:e.target.value}))}
              style={{ background:G.bg,borderRadius:8,padding:"10px 14px",color:G.text,fontSize:14,border:`1px solid ${G.border}` }}>
              <option value="alta">🔴 Alta</option>
              <option value="media">🟡 Média</option>
              <option value="baixa">🟢 Baixa</option>
            </select>
            <textarea value={form.desc} onChange={e=>setForm(p=>({...p,desc:e.target.value}))} placeholder="Descrição..." rows={3}
              style={{ background:G.bg,borderRadius:8,padding:"10px 14px",color:G.text,fontSize:14,border:`1px solid ${G.border}`,resize:"none" }} />
            <button onClick={save} disabled={saving} style={{ background:`linear-gradient(135deg,${G.green},${G.greenDark})`,color:G.white,borderRadius:10,padding:"12px",fontSize:14,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",gap:8 }}>
              {saving?<><Spinner size={16}/>Salvando...</>:"Registrar Ocorrência"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const Sidebar = ()=>(
    <div style={{ width:340,background:G.panel,borderRight:`1px solid ${G.border}`,display:"flex",flexDirection:"column",flexShrink:0 }}>
      <div style={{ padding:"12px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:`1px solid ${G.border}` }}>
        <div style={{ display:"flex",alignItems:"center",gap:10 }}>
          <div style={{ position:"relative" }}>
            <Avatar label={currentUser.avatar||"??"} size={40}/>
            <StatusDot status="online"/>
          </div>
          <div>
            <div style={{ fontSize:14,fontWeight:700,color:G.text }}>{currentUser.name}</div>
            <div style={{ fontSize:11,color:G.green }}>● Online</div>
          </div>
        </div>
        <div style={{ display:"flex",gap:4 }}>
          {currentUser.role==="admin"&&(
            <button onClick={()=>setShowAdmin(!showAdmin)} style={{ background:showAdmin?G.hover:"transparent",borderRadius:8,padding:8 }}>
              <Icon name="settings" color={G.textSub} size={20}/>
            </button>
          )}
          <button onClick={()=>signOut(auth)} style={{ background:"transparent",borderRadius:8,padding:8 }} title="Sair">
            <Icon name="logout" color={G.textSub} size={20}/>
          </button>
        </div>
      </div>

      <div style={{ display:"flex",borderBottom:`1px solid ${G.border}` }}>
        {["chats","grupos","ocorrencias"].map(t=>(
          <button key={t} onClick={()=>setTab(t)} style={{ flex:1,padding:"10px 0",fontSize:11,fontWeight:700,color:tab===t?G.green:G.textSub,background:"transparent",borderBottom:tab===t?`2px solid ${G.green}`:"2px solid transparent",textTransform:"uppercase",letterSpacing:.5 }}>
            {t==="ocorrencias"?"Ocorr.":t.charAt(0).toUpperCase()+t.slice(1)}
          </button>
        ))}
      </div>

      {tab!=="ocorrencias"&&(
        <div style={{ padding:"8px 12px",borderBottom:`1px solid ${G.border}` }}>
          <div style={{ background:G.bg,borderRadius:8,padding:"8px 12px",display:"flex",alignItems:"center",gap:8 }}>
            <Icon name="search" size={16} color={G.textMuted}/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Pesquisar..." style={{ color:G.text,fontSize:13,flex:1 }}/>
          </div>
        </div>
      )}

      <div style={{ flex:1,overflowY:"auto" }}>
        {tab==="ocorrencias"?(
          <div style={{ padding:12,display:"flex",flexDirection:"column",gap:8 }}>
            <button onClick={()=>setNewOccurrence(true)} style={{ background:`linear-gradient(135deg,${G.green},${G.greenDark})`,color:G.white,borderRadius:10,padding:"10px",fontSize:13,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",gap:6,marginBottom:4 }}>
              <Icon name="plus" color={G.white} size={16}/> Nova Ocorrência
            </button>
            {occurrences.length===0&&<div style={{ textAlign:"center",color:G.textMuted,fontSize:13,padding:20 }}>Nenhuma ocorrência ainda</div>}
            {occurrences.map(oc=>(
              <div key={oc.id} className="slide-in" style={{ background:G.bg,borderRadius:10,padding:"12px 14px",borderLeft:`3px solid ${priColor[oc.priority]||G.green}` }}>
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start" }}>
                  <div style={{ fontSize:13,fontWeight:700,color:G.text }}>{oc.title}</div>
                  <span style={{ fontSize:10,fontWeight:700,color:stColor[oc.status],background:(stColor[oc.status]||G.green)+"22",borderRadius:4,padding:"2px 6px" }}>{(oc.status||"aberto").toUpperCase()}</span>
                </div>
                <div style={{ fontSize:11,color:G.textSub,marginTop:4 }}>{oc.from}</div>
                <div style={{ fontSize:11,color:priColor[oc.priority],marginTop:2 }}>Prioridade: {oc.priority}</div>
              </div>
            ))}
          </div>
        ):tabList.length===0?(
          <div style={{ textAlign:"center",color:G.textMuted,fontSize:13,padding:30,whiteSpace:"pre-line" }}>
            {tab==="chats"?"Nenhum contato ainda.\nAdmin adiciona usuários via ⚙":"Nenhum grupo disponível."}
          </div>
        ):tabList.map(chat=>{
          const isActive=activeChat?.id===chat.id;
          return(
            <div key={chat.id} onClick={()=>setActiveChat(chat)} className="slide-in"
              style={{ padding:"10px 16px",display:"flex",alignItems:"center",gap:12,cursor:"pointer",background:isActive?G.hover:"transparent",borderLeft:isActive?`3px solid ${G.green}`:"3px solid transparent",transition:"background .15s" }}>
              <div style={{ position:"relative" }}>
                <Avatar label={chat.avatar||"??"} color={chat.type==="group"?G.greenDark:G.green}/>
                {chat.status&&<StatusDot status={chat.status}/>}
              </div>
              <div style={{ flex:1,minWidth:0 }}>
                <div style={{ fontSize:14,fontWeight:600,color:G.text,display:"flex",alignItems:"center" }}>
                  {chat.name}{chat.role&&<RoleBadge role={chat.role}/>}
                </div>
                <div style={{ fontSize:12,color:G.textSub,marginTop:2 }}>{chat.dept||(chat.type==="group"?`${chat.members?.length||0} membros`:"")}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const AdminPanel = ()=>(
    <div style={{ position:"fixed",top:64,left:16,width:340,background:G.panel,borderRadius:12,boxShadow:"0 8px 32px #0006",border:`1px solid ${G.border}`,zIndex:100,maxHeight:"80vh",overflowY:"auto" }} className="fade-in">
      <div style={{ padding:"14px 16px",borderBottom:`1px solid ${G.border}`,display:"flex",justifyContent:"space-between",alignItems:"center",position:"sticky",top:0,background:G.panel }}>
        <div style={{ fontWeight:700,fontSize:14 }}>⚙ Painel Admin</div>
        <button onClick={()=>setShowAdmin(false)} style={{ background:"transparent" }}><Icon name="close" size={16} color={G.textSub}/></button>
      </div>
      <div style={{ padding:16 }}>
        <div style={{ fontSize:12,color:G.textSub,marginBottom:10,fontWeight:700,letterSpacing:.5 }}>USUÁRIOS ({contacts.length+1})</div>
        {[currentUser,...contacts].map(u=>(
          <div key={u.uid||u.id} style={{ display:"flex",alignItems:"center",gap:10,padding:"8px 10px",borderRadius:8,marginBottom:6,background:G.bg }}>
            <Avatar label={u.avatar||"??"} size={32}/>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13,fontWeight:600,color:G.text,display:"flex",alignItems:"center" }}>
                {u.name}{(u.uid||u.id)===currentUser.uid&&<span style={{ fontSize:10,color:G.green,marginLeft:4 }}>(você)</span>}
                <RoleBadge role={u.role}/>
              </div>
              <div style={{ fontSize:11,color:G.textMuted }}>{u.dept||u.email}</div>
            </div>
          </div>
        ))}
        <button onClick={()=>{setShowAdmin(false);setShowAddUser(true);}} style={{ width:"100%",marginTop:8,background:`linear-gradient(135deg,${G.green},${G.greenDark})`,color:G.white,borderRadius:10,padding:"10px",fontSize:13,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",gap:6 }}>
          <Icon name="plus" color={G.white} size={16}/> Adicionar Usuário
        </button>
      </div>
    </div>
  );

  const ChatArea = ()=>{
    const fileRef=useRef(null);
    if(!activeChat) return(
      <div style={{ flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:G.bg,backgroundImage:`radial-gradient(ellipse at 50% 40%,${G.green}0a 0%,transparent 65%)` }}>
        <div style={{ width:80,height:80,borderRadius:"50%",background:`linear-gradient(135deg,${G.green}33,${G.greenDark}33)`,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:20 }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill={G.green+"88"}><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
        </div>
        <div style={{ fontSize:20,fontWeight:700,color:G.text,marginBottom:8 }}>Bem-vindo ao Talkz</div>
        <div style={{ fontSize:14,color:G.textSub,maxWidth:280,textAlign:"center" }}>Selecione uma conversa para começar</div>
      </div>
    );
    return(
      <div style={{ flex:1,display:"flex",flexDirection:"column",background:G.bg }}>
        <div style={{ padding:"10px 20px",display:"flex",alignItems:"center",gap:12,borderBottom:`1px solid ${G.border}`,background:G.panel }}>
          <div style={{ position:"relative" }}>
            <Avatar label={activeChat.avatar||"??"} color={activeChat.type==="group"?G.greenDark:G.green}/>
            {activeChat.status&&<StatusDot status={activeChat.status}/>}
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:15,fontWeight:700,color:G.text,display:"flex",alignItems:"center" }}>
              {activeChat.name}{activeChat.role&&<RoleBadge role={activeChat.role}/>}
            </div>
            <div style={{ fontSize:12,color:G.textSub }}>{activeChat.type==="group"?`${activeChat.members?.length||0} membros`:(activeChat.status==="online"?"Online":"Offline")}</div>
          </div>
        </div>
        <div style={{ flex:1,overflowY:"auto",padding:"16px 20px",display:"flex",flexDirection:"column",gap:6,backgroundImage:`url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2300a884' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }}>
          {loadingMsgs&&<div style={{ display:"flex",justifyContent:"center",padding:20 }}><Spinner/></div>}
          {!loadingMsgs&&messages.length===0&&<div style={{ textAlign:"center",color:G.textMuted,fontSize:13,marginTop:40 }}>Nenhuma mensagem ainda. Diga olá! 👋</div>}
          {messages.map(msg=>{
            const isMine=msg.from===currentUser.uid;
            return(
              <div key={msg.id} className="fade-in" style={{ display:"flex",justifyContent:isMine?"flex-end":"flex-start" }}>
                <div style={{ maxWidth:"65%",background:isMine?G.sent:G.received,borderRadius:isMine?"12px 12px 2px 12px":"12px 12px 12px 2px",padding:"8px 12px",boxShadow:"0 1px 3px #0003" }}>
                  {activeChat.type==="group"&&!isMine&&<div style={{ fontSize:11,fontWeight:700,color:G.green,marginBottom:3 }}>{msg.fromName}</div>}
                  {msg.type==="image"&&msg.fileUrl&&<img src={msg.fileUrl} alt="img" style={{ maxWidth:220,borderRadius:8,marginBottom:4,display:"block" }}/>}
                  {msg.type==="file"&&msg.fileUrl&&<a href={msg.fileUrl} target="_blank" rel="noreferrer" style={{ color:G.blue,fontSize:13,display:"block",marginBottom:4 }}>📎 {msg.fileName}</a>}
                  {msg.text&&<div style={{ fontSize:14,color:G.text,lineHeight:1.4 }}>{msg.text}</div>}
                  <div style={{ fontSize:11,color:G.textMuted,textAlign:"right",marginTop:4,display:"flex",alignItems:"center",justifyContent:"flex-end",gap:3 }}>
                    {msg.createdAt?.toDate?.()?.toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})||""}
                    {isMine&&<Icon name="check" size={14} color={G.green}/>}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={msgEndRef}/>
        </div>
        <div style={{ padding:"10px 16px",background:G.panel,borderTop:`1px solid ${G.border}`,display:"flex",alignItems:"center",gap:10 }}>
          <input type="file" ref={fileRef} style={{ display:"none" }} onChange={e=>{if(e.target.files[0])sendFile(e.target.files[0]);e.target.value="";}}/>
          <button onClick={()=>fileRef.current?.click()} style={{ background:"transparent",padding:6 }}>
            <Icon name="attach" color={G.textSub} size={22}/>
          </button>
          <div style={{ flex:1,background:G.bg,borderRadius:24,padding:"10px 16px",display:"flex",alignItems:"center" }}>
            <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&sendMessage()} placeholder="Digite uma mensagem..." style={{ color:G.text,fontSize:14,flex:1 }}/>
          </div>
          <button onClick={sendMessage} style={{ width:44,height:44,borderRadius:"50%",background:input.trim()?`linear-gradient(135deg,${G.green},${G.greenDark})`:G.border,display:"flex",alignItems:"center",justifyContent:"center",transition:"background .2s",boxShadow:input.trim()?`0 4px 12px ${G.green}44`:"none" }}>
            <Icon name="send" color={G.white} size={20}/>
          </button>
        </div>
      </div>
    );
  };

  return(
    <div style={{ display:"flex",height:"100vh",overflow:"hidden" }}>
      <style>{css}</style>
      <Sidebar/>
      <ChatArea/>
      {showAdmin&&currentUser.role==="admin"&&<AdminPanel/>}
      {newOccurrence&&<OccurrenceModal/>}
      {showAddUser&&<AddUserModal/>}
    </div>
  );
}
