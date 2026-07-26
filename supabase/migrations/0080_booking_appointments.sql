-- Migration 0080: Appointments Booking Module
-- Creates the foundational tables for real scheduling and booking of services.

CREATE TABLE IF NOT EXISTS public.booking_services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  price_cents INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.booking_appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.booking_services(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  guest_name TEXT,
  guest_phone TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.booking_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_appointments ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- Policies for booking_services
-- -----------------------------------------------------------------------------

-- Public can read active services
CREATE POLICY "Public can read active booking services"
  ON public.booking_services FOR SELECT
  USING (status = 'active');

-- Store owners/admins can CRUD their services
CREATE POLICY "Store staff can manage booking services"
  ON public.booking_services FOR ALL
  TO authenticated
  USING (
    store_id IN (
      SELECT store_id FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('owner', 'admin', 'manager')
    )
  );

-- -----------------------------------------------------------------------------
-- Policies for booking_appointments
-- -----------------------------------------------------------------------------

-- Customers can insert their own appointments
CREATE POLICY "Customers can create appointments"
  ON public.booking_appointments FOR INSERT
  TO public, authenticated
  WITH CHECK (true); -- Insert validation handled via Server Function

-- Customers can read their own appointments
CREATE POLICY "Customers can read own appointments"
  ON public.booking_appointments FOR SELECT
  TO authenticated
  USING (customer_id = auth.uid());

-- Store staff can CRUD their store's appointments
CREATE POLICY "Store staff can manage appointments"
  ON public.booking_appointments FOR ALL
  TO authenticated
  USING (
    store_id IN (
      SELECT store_id FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('owner', 'admin', 'manager')
    )
  );
