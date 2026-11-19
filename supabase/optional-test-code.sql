-- Oddiy testlar kod bilan qo'shilmaydi; faqat jonli testlarda 6 xonali kod bo'ladi.
-- Mavjud test kodlari va unique cheklovi saqlanadi.
alter table public.shared_lessons alter column code drop not null;

