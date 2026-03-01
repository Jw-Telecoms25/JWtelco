-- =====================================================
-- JWTelecoms — Seed Pricing Plans (run after schema)
-- All prices in kobo (100 kobo = ₦1)
-- =====================================================

-- Get service IDs
DO $$
DECLARE
  v_airtime_id UUID;
  v_data_id UUID;
  v_electricity_id UUID;
  v_cable_id UUID;
  v_exam_id UUID;
BEGIN
  SELECT id INTO v_airtime_id FROM services WHERE slug = 'airtime';
  SELECT id INTO v_data_id FROM services WHERE slug = 'data';
  SELECT id INTO v_electricity_id FROM services WHERE slug = 'electricity';
  SELECT id INTO v_cable_id FROM services WHERE slug = 'cable';
  SELECT id INTO v_exam_id FROM services WHERE slug = 'exam-pins';

  -- AIRTIME PLANS (discount-based: user pays less than face value)
  INSERT INTO pricing (service_id, plan_name, plan_code, network, user_price, agent_price, vendor_price, cost_price) VALUES
    (v_airtime_id, 'MTN ₦100', 'mtn-100', 'mtn', 9800, 9700, 9600, 9500),
    (v_airtime_id, 'MTN ₦200', 'mtn-200', 'mtn', 19600, 19400, 19200, 19000),
    (v_airtime_id, 'MTN ₦500', 'mtn-500', 'mtn', 49000, 48500, 48000, 47500),
    (v_airtime_id, 'MTN ₦1000', 'mtn-1000', 'mtn', 98000, 97000, 96000, 95000),
    (v_airtime_id, 'Airtel ₦100', 'airtel-100', 'airtel', 9800, 9700, 9600, 9500),
    (v_airtime_id, 'Airtel ₦200', 'airtel-200', 'airtel', 19600, 19400, 19200, 19000),
    (v_airtime_id, 'Airtel ₦500', 'airtel-500', 'airtel', 49000, 48500, 48000, 47500),
    (v_airtime_id, 'Airtel ₦1000', 'airtel-1000', 'airtel', 98000, 97000, 96000, 95000),
    (v_airtime_id, 'Glo ₦100', 'glo-100', 'glo', 9800, 9700, 9600, 9500),
    (v_airtime_id, 'Glo ₦200', 'glo-200', 'glo', 19600, 19400, 19200, 19000),
    (v_airtime_id, 'Glo ₦500', 'glo-500', 'glo', 49000, 48500, 48000, 47500),
    (v_airtime_id, 'Glo ₦1000', 'glo-1000', 'glo', 98000, 97000, 96000, 95000),
    (v_airtime_id, '9mobile ₦100', '9mobile-100', '9mobile', 9800, 9700, 9600, 9500),
    (v_airtime_id, '9mobile ₦200', '9mobile-200', '9mobile', 19600, 19400, 19200, 19000),
    (v_airtime_id, '9mobile ₦500', '9mobile-500', '9mobile', 49000, 48500, 48000, 47500),
    (v_airtime_id, '9mobile ₦1000', '9mobile-1000', '9mobile', 98000, 97000, 96000, 95000);

  -- DATA PLANS
  INSERT INTO pricing (service_id, plan_name, plan_code, network, user_price, agent_price, vendor_price, cost_price, validity) VALUES
    -- MTN Data
    (v_data_id, 'MTN 500MB', 'mtn-500mb', 'mtn', 15000, 14500, 14000, 13000, '30 days'),
    (v_data_id, 'MTN 1GB', 'mtn-1gb', 'mtn', 26000, 25500, 25000, 24000, '30 days'),
    (v_data_id, 'MTN 2GB', 'mtn-2gb', 'mtn', 50000, 49000, 48000, 47000, '30 days'),
    (v_data_id, 'MTN 3GB', 'mtn-3gb', 'mtn', 75000, 73000, 71000, 70000, '30 days'),
    (v_data_id, 'MTN 5GB', 'mtn-5gb', 'mtn', 125000, 122000, 120000, 118000, '30 days'),
    (v_data_id, 'MTN 10GB', 'mtn-10gb', 'mtn', 250000, 245000, 240000, 235000, '30 days'),
    -- Airtel Data
    (v_data_id, 'Airtel 500MB', 'airtel-500mb', 'airtel', 15000, 14500, 14000, 13000, '30 days'),
    (v_data_id, 'Airtel 1GB', 'airtel-1gb', 'airtel', 26000, 25500, 25000, 24000, '30 days'),
    (v_data_id, 'Airtel 2GB', 'airtel-2gb', 'airtel', 50000, 49000, 48000, 47000, '30 days'),
    (v_data_id, 'Airtel 5GB', 'airtel-5gb', 'airtel', 125000, 122000, 120000, 118000, '30 days'),
    -- Glo Data
    (v_data_id, 'Glo 500MB', 'glo-500mb', 'glo', 13000, 12500, 12000, 11000, '30 days'),
    (v_data_id, 'Glo 1GB', 'glo-1gb', 'glo', 24000, 23500, 23000, 22000, '30 days'),
    (v_data_id, 'Glo 2GB', 'glo-2gb', 'glo', 48000, 47000, 46000, 45000, '30 days'),
    (v_data_id, 'Glo 5GB', 'glo-5gb', 'glo', 120000, 118000, 115000, 113000, '30 days'),
    -- 9mobile Data
    (v_data_id, '9mobile 500MB', '9mobile-500mb', '9mobile', 13000, 12500, 12000, 11000, '30 days'),
    (v_data_id, '9mobile 1GB', '9mobile-1gb', '9mobile', 24000, 23500, 23000, 22000, '30 days'),
    (v_data_id, '9mobile 2GB', '9mobile-2gb', '9mobile', 48000, 47000, 46000, 45000, '30 days');

  -- CABLE TV PLANS
  INSERT INTO pricing (service_id, plan_name, plan_code, network, user_price, agent_price, vendor_price, cost_price, validity) VALUES
    -- DStv
    (v_cable_id, 'DStv Padi', 'dstv-padi', 'dstv', 245000, 243000, 241000, 240000, '1 month'),
    (v_cable_id, 'DStv Yanga', 'dstv-yanga', 'dstv', 355000, 352000, 350000, 348000, '1 month'),
    (v_cable_id, 'DStv Confam', 'dstv-confam', 'dstv', 575000, 572000, 570000, 568000, '1 month'),
    (v_cable_id, 'DStv Compact', 'dstv-compact', 'dstv', 1050000, 1045000, 1040000, 1035000, '1 month'),
    (v_cable_id, 'DStv Compact Plus', 'dstv-compact-plus', 'dstv', 1650000, 1640000, 1630000, 1620000, '1 month'),
    (v_cable_id, 'DStv Premium', 'dstv-premium', 'dstv', 2950000, 2935000, 2920000, 2900000, '1 month'),
    -- GOtv
    (v_cable_id, 'GOtv Smallie', 'gotv-smallie', 'gotv', 105000, 103000, 102000, 101000, '1 month'),
    (v_cable_id, 'GOtv Jinja', 'gotv-jinja', 'gotv', 195000, 193000, 191000, 190000, '1 month'),
    (v_cable_id, 'GOtv Jolli', 'gotv-jolli', 'gotv', 305000, 303000, 301000, 300000, '1 month'),
    (v_cable_id, 'GOtv Max', 'gotv-max', 'gotv', 460000, 457000, 455000, 453000, '1 month'),
    (v_cable_id, 'GOtv Supa', 'gotv-supa', 'gotv', 630000, 627000, 625000, 623000, '1 month'),
    -- StarTimes
    (v_cable_id, 'StarTimes Nova', 'startimes-nova', 'startimes', 110000, 108000, 107000, 106000, '1 month'),
    (v_cable_id, 'StarTimes Basic', 'startimes-basic', 'startimes', 195000, 193000, 192000, 191000, '1 month'),
    (v_cable_id, 'StarTimes Smart', 'startimes-smart', 'startimes', 290000, 288000, 287000, 286000, '1 month'),
    (v_cable_id, 'StarTimes Super', 'startimes-super', 'startimes', 490000, 487000, 485000, 483000, '1 month');

  -- EXAM PINS
  INSERT INTO pricing (service_id, plan_name, plan_code, network, user_price, agent_price, vendor_price, cost_price) VALUES
    (v_exam_id, 'WAEC Result Checker', 'waec-result', 'waec', 380000, 375000, 370000, 360000),
    (v_exam_id, 'WAEC Registration', 'waec-reg', 'waec', 1850000, 1840000, 1830000, 1820000),
    (v_exam_id, 'NECO Result Checker', 'neco-result', 'neco', 100000, 98000, 96000, 94000),
    (v_exam_id, 'NECO Registration', 'neco-reg', 'neco', 1400000, 1390000, 1380000, 1370000),
    (v_exam_id, 'NABTEB Result Checker', 'nabteb-result', 'nabteb', 100000, 98000, 96000, 94000);

END $$;
