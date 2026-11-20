import json, random, datetime as dt
random.seed(1801)
TODAY=dt.date(2026,11,20)  # Friday, San Francisco
START=TODAY-dt.timedelta(days=27); END=TODAY+dt.timedelta(days=15)
CLOSED={dt.date(2026,11,26)}  # Thanksgiving
PRICES={'SP':27.5,'SW':27.5,'MP':74.5,'MW':74.5,'LP':107.5,'LW':107.5}
SLOTS=[f'{h:02d}:{m:02d}' for h in range(9,18) for m in (0,30) if (h,m)>=(9,30)]+['17:45']
first=['Maya','Daniel','Priya','Marcus','Elena','Jonah','Sofia','Kenji','Aisha','Lucas','Hannah','Omar','Grace','Diego','Leila','Ethan','Nadia','Theo','Camila','Ravi','Zoe','Samir','Ivy','Mateo','Chloe','Arjun','Noor','Felix','Rosa','Tariq','Lena','Andre','Mina','Caleb','Yasmin','Owen']
last=['Chen','Rivera','Patel','Kim','Nguyen','Haddad','Okafor','Brooks','Sato','Levine','Moreno','Shah','Fischer','Aydin','Lopez','Park','Walsh','Demir','Costa','Reyes','Kaplan','Bauer','Yilmaz','Ortiz']
def phone(i): return f'(415) {random.choice(["206","282","386","431","522","648","730","819","902"])}-{1000+i*37%9000:04d}'
people=[]
for i in range(70):
    people.append({'name':f'{random.choice(first)} {random.choice(last)}','phone':phone(i)})
regulars=people[:12]
notes=['Gift box please','For Thanksgiving dinner','Less sweet if possible','Birthday, add a candle','Office party','Call when outside','Extra syrup on the side','For my mom','Picking up for a friend']
orders=[];oid=0
def items():
    r=random.random()
    if r<.45: return [(random.choice(['SP','SW']),random.choice([1,1,1,2]))]
    if r<.75: return [(random.choice(['MP','MW']),1)]+([(random.choice(['SP','SW']),1)] if random.random()<.3 else [])
    if r<.9: return [(random.choice(['LP','LW']),1)]
    return [(random.choice(['MP','LP']),random.choice([1,2])),(random.choice(['SW','MW']),1)]
d=START
while d<=END:
    if d.weekday()==6 or d in CLOSED: d+=dt.timedelta(days=1); continue
    base={0:5,1:5,2:6,3:6,4:8,5:11}[d.weekday()]
    if d==dt.date(2026,11,25): base=17
    if d==dt.date(2026,11,24): base=11
    if d>TODAY: base=max(2,int(base*(0.75 if d<=TODAY+dt.timedelta(days=6) else 0.35)))
    n=max(1,base+random.randint(-2,2))
    for t in sorted(random.sample(SLOTS,min(n,len(SLOTS)))):
        p=random.choice(regulars) if random.random()<.45 else random.choice(people[12:])
        it=items()
        if d==dt.date(2026,11,25) and random.random()<.5: it=[(random.choice(['LP','LW']),1)]
        web=random.random()<.75
        st,paid,ready='new','none',''
        if d<TODAY:
            st='cancelled' if random.random()<.03 else 'picked'; paid='paid' if st=='picked' else 'none'
        elif d==TODAY:
            if t<'11:30': st,paid='picked','paid'
            elif t<'13:00': st,ready='new','2026-11-20 '+t
            elif web and random.random()<.35: st='pending'
        else:
            if web and d<=TODAY+dt.timedelta(days=4) and random.random()<.18: st='pending'
        oid+=1
        note=random.choice(notes) if random.random()<.15 else ''
        if d==dt.date(2026,11,25) and random.random()<.4: note='For Thanksgiving dinner'
        orders.append({'id':('w' if web else 'h')+f'{oid:06x}','date':d.isoformat(),'time':t,'name':p['name'],'phone':p['phone'],
            'items':', '.join(f'{q}x{c}' for c,q in it),'note':note,'paid':paid,'status':st,'sample':'','source':'web' if web else 'hand',
            'seen':'yes' if st!='pending' else '','optin':'yes' if web and random.random()<.8 else '','ready':ready,
            'prices':json.dumps({c:PRICES[c] for c,q in it},separators=(',',':'))})
    d+=dt.timedelta(days=1)
# counter sales last 14 days incl today morning
menu=[('Turkish coffee',4.5),('Espresso',3.5),('Cappuccino',5),('Latte',5.5),('Iced latte',6),('Turkish tea',3),('Baklava, 2 pieces',6)]
counter=[];rewards=[];cid=0
d=TODAY-dt.timedelta(days=13)
while d<=TODAY:
    if d.weekday()==6: d+=dt.timedelta(days=1); continue
    for k in range(random.randint(9,18) if d<TODAY else 7):
        hh=random.randint(9,17) if d<TODAY else random.randint(9,11); mm=random.randint(0,59)
        when=f'{d.isoformat()} {hh:02d}:{mm:02d}'
        lines=[(random.choices(menu,weights=[5,2,3,4,3,2,3])[0],1)]
        if random.random()<.3: lines.append((random.choice(menu),1))
        tot=sum(m[1]*q for m,q in lines)
        who=None
        r=random.random()
        if r<.35: who=random.choice(regulars)
        elif r<.55: who=random.choice(people[12:40])
        cid+=1
        counter.append([when,d.isoformat(),', '.join(f'{q} x {m[0]}' for m,q in lines),f'{tot:.2f}',who['phone'] if who else '',who['name'] if who else '','tolgay',f'c{cid:08x}'])
        if who: rewards.append([when,who['phone'],who['name'],'counter','1','Counter sale c%08x'%cid,'tolgay'])
    d+=dt.timedelta(days=1)
counter.sort(key=lambda r:r[0]); 
# a few rewards given and treats
for p,at,day in [(regulars[0],5,'2026-11-12 10:14'),(regulars[1],5,'2026-11-14 15:02'),(regulars[0],10,'2026-11-19 12:40'),(regulars[3],5,'2026-11-18 09:51')]:
    rewards.append([day,p['phone'],p['name'],'redeem','1',f'layer {at}','tolgay'])
rewards.append(['2026-11-17 13:20',regulars[2]['phone'],regulars[2]['name'],'treat','1','Birthday, 2 pieces on us','tolgay'])
rewards.append(['2026-11-19 16:05',regulars[5]['phone'],regulars[5]['name'],'treat','1','Sorry for the wait, coffee on us','tolgay'])
# most earned rewards were already given (realistic): walk each customer's visits in date order
import collections
visits=collections.defaultdict(list)
for o in orders:
    if o['status']=='picked': visits[o['phone']].append((o['date']+' '+o['time'],o['name']))
for r in rewards:
    if r[3]=='counter': visits[r[1]].append((r[0],r[2]))
rewards=[r for r in rewards if r[3]!='redeem']
for ph,vs in visits.items():
    vs.sort()
    for i,(when,name) in enumerate(vs,1):
        at=5 if i%10==5 else 10 if i%10==0 else None
        if at and when<'2026-11-19' and random.random()<.8:
            rewards.append([when[:16],ph,name,'redeem','1',f'layer {at}','tolgay'])
rewards.sort(key=lambda r:r[0])
json.dump({'today':TODAY.isoformat(),'orders':orders,'counter':counter,'rewards':rewards,'menu':menu,'closed':[x.isoformat() for x in CLOSED]},open('/home/claude/demo/demo.json','w'))
from collections import Counter
print(len(orders),'orders', Counter(o['status'] for o in orders), len(counter),'counter', len(rewards),'reward rows')
print('today', [ (o['time'],o['name'],o['status']) for o in orders if o['date']==TODAY.isoformat()])
