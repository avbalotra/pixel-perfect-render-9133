
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  name text,
  organization text,
  role text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile" ON public.profiles FOR ALL TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE TABLE public.commodities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  category text NOT NULL,
  moisture_sensitivity text NOT NULL,
  perishability text NOT NULL,
  respiration_category text NOT NULL,
  typical_storage text NOT NULL,
  fresh_produce boolean NOT NULL DEFAULT false,
  default_moisture numeric,
  default_oil numeric,
  default_ph numeric,
  default_respiration text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.commodities TO anon;
GRANT SELECT ON public.commodities TO authenticated;
GRANT ALL ON public.commodities TO service_role;
ALTER TABLE public.commodities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "commodities public read" ON public.commodities FOR SELECT USING (true);

CREATE TABLE public.materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  category text NOT NULL,
  description text NOT NULL,
  oxygen_barrier smallint NOT NULL,
  moisture_barrier smallint NOT NULL,
  light_barrier smallint NOT NULL,
  mechanical_strength smallint NOT NULL,
  sealability smallint NOT NULL,
  sustainability smallint NOT NULL,
  recyclability text NOT NULL,
  otr_label text NOT NULL,
  wvtr_label text NOT NULL,
  otr_value numeric NOT NULL,
  wvtr_value numeric NOT NULL,
  thickness_range text NOT NULL,
  temp_min numeric NOT NULL,
  temp_max numeric NOT NULL,
  relative_cost smallint NOT NULL,
  cost_index numeric NOT NULL,
  map_suitable boolean NOT NULL DEFAULT false,
  fresh_produce_suitable boolean NOT NULL DEFAULT false,
  data_status text NOT NULL DEFAULT 'Prototype Reference Value',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.materials TO anon;
GRANT SELECT ON public.materials TO authenticated;
GRANT ALL ON public.materials TO service_role;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "materials public read" ON public.materials FOR SELECT USING (true);

CREATE TABLE public.analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  commodity_name text NOT NULL,
  commodity_category text,
  storage_type text NOT NULL,
  inputs jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.analyses TO authenticated;
GRANT ALL ON public.analyses TO service_role;
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own analyses" ON public.analyses FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id uuid NOT NULL REFERENCES public.analyses ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  material_slug text NOT NULL,
  material_name text NOT NULL,
  compatibility numeric NOT NULL,
  shelf_life_min integer NOT NULL,
  shelf_life_max integer NOT NULL,
  reasons jsonb NOT NULL DEFAULT '[]'::jsonb,
  specifications jsonb NOT NULL DEFAULT '{}'::jsonb,
  factors jsonb NOT NULL DEFAULT '[]'::jsonb,
  map_conditions jsonb NOT NULL DEFAULT '{}'::jsonb,
  alternatives jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.recommendations TO authenticated;
GRANT ALL ON public.recommendations TO service_role;
ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own recommendations" ON public.recommendations FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.analysis_material_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id uuid NOT NULL REFERENCES public.analyses ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  material_slug text NOT NULL,
  material_name text NOT NULL,
  score numeric NOT NULL,
  breakdown jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.analysis_material_scores TO authenticated;
GRANT ALL ON public.analysis_material_scores TO service_role;
ALTER TABLE public.analysis_material_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own scores" ON public.analysis_material_scores FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id uuid NOT NULL REFERENCES public.analyses ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  title text NOT NULL,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reports TO authenticated;
GRANT ALL ON public.reports TO service_role;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own reports" ON public.reports FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

INSERT INTO public.materials (slug,name,category,description,oxygen_barrier,moisture_barrier,light_barrier,mechanical_strength,sealability,sustainability,recyclability,otr_label,wvtr_label,otr_value,wvtr_value,thickness_range,temp_min,temp_max,relative_cost,cost_index,map_suitable,fresh_produce_suitable) VALUES
('ldpe','LDPE','Polyolefin Film','Flexible low-density polyethylene film with good moisture protection and excellent sealability.',2,4,1,3,5,3,'High','High OTR','Low WVTR',6500,2.5,'25-100 μm',-40,80,1,1.0,false,true),
('hdpe','HDPE','Polyolefin Film','Stiffer polyethylene with strong moisture barrier and good mechanical strength at low cost.',2,5,2,4,4,4,'High','High OTR','Very Low WVTR',5200,1.2,'20-80 μm',-40,100,1,1.1,false,false),
('pet','PET','Polyester Film','Clear polyester film with balanced barrier properties and high mechanical strength.',4,3,1,5,3,3,'High','Moderate OTR','Moderate WVTR',80,18,'12-50 μm',-60,150,3,2.2,true,false),
('pp','PP','Polyolefin Film','Polypropylene film with good clarity, heat resistance and moderate moisture barrier.',2,4,1,4,4,4,'High','High OTR','Low WVTR',2400,6,'20-80 μm',-20,120,2,1.3,false,true),
('bopp','BOPP','Oriented Film','Biaxially oriented polypropylene with excellent stiffness, printability and moisture barrier.',2,5,2,5,3,4,'Moderate','High OTR','Very Low WVTR',1800,3,'15-60 μm',-20,120,2,1.5,false,true),
('met-pet','Metallized PET','Metallized Laminate','Metallized polyester offering strong oxygen, light and moisture barrier for sensitive dry foods.',5,5,5,4,4,2,'Low','Low OTR','Very Low WVTR',3,0.6,'12-30 μm',-40,130,3,2.8,true,false),
('alu-foil','Aluminium Foil Laminate','Foil Laminate','Foil-based laminate providing near-absolute barrier to oxygen, moisture, light and aroma.',5,5,5,4,5,1,'Low','Very Low OTR','Very Low WVTR',0.5,0.1,'40-120 μm',-40,180,5,4.2,true,false),
('evoh','EVOH Multilayer','Multilayer Barrier','PET/EVOH/PE structure combining a high oxygen barrier core with sealable and tough outer layers.',5,4,2,4,5,2,'Low','Very Low OTR','Low WVTR',1.5,3,'60-100 μm',-40,120,4,3.4,true,false),
('pla','PLA','Compostable Bioplastic','Plant-based compostable film suitable for short shelf-life and ambient dry applications.',3,2,1,2,3,5,'Compostable','Moderate OTR','High WVTR',550,45,'20-60 μm',-10,45,3,2.6,false,true),
('cellulose','Cellulose Film','Compostable Bioplastic','Renewable cellulose-based film with good aroma retention and home-compostable end-of-life.',3,2,1,2,3,5,'Compostable','Moderate OTR','High WVTR',400,38,'20-45 μm',-20,60,3,2.7,false,true),
('paper-barrier','Paper-Based Barrier Film','Paper Composite','Coated paper structure balancing recyclability with moderate moisture and grease resistance.',2,3,5,3,3,5,'High','High OTR','Moderate WVTR',3200,14,'60-150 μm',-10,90,2,1.9,false,false),
('breathable-pe','Breathable PE Film','Fresh Produce Film','Engineered permeable polyethylene film for controlled gas exchange with respiring produce.',1,3,1,3,4,3,'High','Very High OTR','Moderate WVTR',12000,9,'25-50 μm',-5,60,2,1.6,true,true),
('micro-perf','Micro-Perforated Film','Fresh Produce Film','Laser micro-perforated film that vents respiration gases and limits in-pack condensation.',1,2,1,3,4,3,'High','Very High OTR','High WVTR',24000,22,'20-45 μm',-5,60,2,1.4,true,true);

INSERT INTO public.commodities (name,category,moisture_sensitivity,perishability,respiration_category,typical_storage,fresh_produce,default_moisture,default_oil,default_ph,default_respiration) VALUES
('Apple','Fruits','Moderate','Moderate','Low','Cold Storage',true,85,0.2,3.5,'Low'),
('Banana','Fruits','Moderate','High','High','Ambient',true,74,0.3,5.0,'High'),
('Mango','Fruits','Moderate','High','High','Chilled',true,83,0.4,4.0,'High'),
('Tomato','Vegetables','High','High','High','Chilled',true,94,0.2,4.2,'High'),
('Potato','Vegetables','Moderate','Low','Low','Ambient',true,79,0.1,6.0,'Low'),
('Onion','Vegetables','Low','Low','Very Low','Ambient',true,89,0.1,5.5,'Very Low'),
('Rice','Cereals','High','Very Low','Very Low','Ambient',false,12,0.7,6.5,'Very Low'),
('Wheat','Cereals','High','Very Low','Very Low','Ambient',false,12,1.8,6.2,'Very Low'),
('Maize','Cereals','High','Very Low','Very Low','Ambient',false,13,4.5,6.3,'Very Low'),
('Pulses','Pulses','High','Very Low','Very Low','Ambient',false,11,1.5,6.4,'Very Low'),
('Milk','Dairy','High','Very High','Very Low','Chilled',false,87,3.5,6.7,'Very Low'),
('Paneer','Dairy','High','Very High','Very Low','Chilled',false,55,22,5.9,'Very Low'),
('Curd','Dairy','High','High','Very Low','Chilled',false,85,4.0,4.4,'Very Low'),
('Cheese','Dairy','High','Moderate','Very Low','Chilled',false,40,30,5.3,'Very Low'),
('Chicken','Meat','High','Very High','Very Low','Chilled',false,74,5.0,6.0,'Very Low'),
('Fish','Seafood','High','Very High','Very Low','Chilled',false,76,6.0,6.5,'Very Low'),
('Bread','Bakery','High','High','Very Low','Ambient',false,38,4.0,5.5,'Very Low'),
('Biscuits','Bakery','Very High','Low','Very Low','Ambient',false,4,20,7.0,'Very Low'),
('Spices','Spices','High','Low','Very Low','Ambient',false,9,8.0,5.8,'Very Low');
