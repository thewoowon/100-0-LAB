export default function TermsPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-xl font-semibold mb-2" style={{ color: "var(--text)" }}>
        이용약관
      </h1>
      <p className="text-xs mb-10" style={{ color: "var(--text-muted)" }}>
        시행일: 2025년 6월 1일
      </p>

      <Section title="제1조 (목적)">
        <p>
          이 약관은 100:0 연구소(이하 "서비스")가 제공하는 블랙박스 영상 제보 및 콘텐츠 서비스의
          이용 조건과 절차, 서비스 제공자와 이용자 간의 권리·의무 및 책임 사항을 규정함을 목적으로 합니다.
        </p>
      </Section>

      <Section title="제2조 (서비스 내용)">
        <p>서비스는 다음을 제공합니다.</p>
        <List
          items={[
            "블랙박스 영상 제보 접수 및 검수",
            "채택된 영상의 편집·비식별 처리 후 플랫폼 게시",
            "채택 영상 제보자에 대한 보상금 지급",
            "사고 영상 기반 콘텐츠 열람 및 투표 기능",
          ]}
        />
      </Section>

      <Section title="제3조 (회원 가입)">
        <p>
          서비스는 Google 계정을 통한 OAuth 2.0 방식으로 회원 가입을 제공합니다.
          가입 시 Google로부터 이메일, 닉네임, 프로필 이미지를 제공받습니다.
          만 14세 미만은 서비스를 이용할 수 없습니다.
        </p>
      </Section>

      <Section title="제4조 (영상 제보 조건)">
        <p>제보 영상은 다음 조건을 모두 충족해야 합니다.</p>
        <List
          items={[
            "제보자가 직접 촬영하였거나 적법한 권한을 보유한 영상",
            "재생 시간 1분 이하",
            "mp4, mov, webm 형식, 300MB 이하",
            "타인의 저작권·초상권·개인정보를 침해하지 않는 영상",
            "뉴스·방송 등 이미 공개된 영상이 아닐 것",
            "실제 도로 위 사고·위험 상황이 포함된 영상",
          ]}
        />
      </Section>

      <Section title="제5조 (영상 저작권 및 이용 허락)">
        <p>
          제보자는 영상 제보 시 100:0 연구소에 다음의 권리를 비독점적으로 허락합니다.
        </p>
        <List
          items={[
            "영상의 편집, 가공, 비식별(번호판·얼굴 블러) 처리",
            "서비스 플랫폼 및 SNS 채널 게시·홍보",
            "교육·공익 목적의 활용",
          ]}
        />
        <p className="mt-2">
          제보자는 원본 영상에 대한 저작권을 유지합니다.
          서비스는 제보자의 동의 없이 위 범위를 초과하여 영상을 사용하지 않습니다.
        </p>
      </Section>

      <Section title="제6조 (보상금 지급)">
        <List
          items={[
            "보상금은 운영팀의 검수를 통해 '채택'으로 결정된 영상에 한하여 지급됩니다.",
            "지급 금액은 영상 1건당 5,000원입니다.",
            "지급 수단은 제보 시 입력한 계좌로 이체하며, 채택 결정 후 영업일 기준 14일 이내에 지급합니다.",
            "동일 또는 유사한 영상이 중복 제보된 경우, 먼저 접수된 건에만 지급됩니다.",
            "허위 제보, 권리 침해 영상으로 확인된 경우 지급이 취소되며, 이미 지급된 경우 반환을 요청할 수 있습니다.",
          ]}
        />
      </Section>

      <Section title="제7조 (이용자 금지 행위)">
        <p>이용자는 다음 행위를 해서는 안 됩니다.</p>
        <List
          items={[
            "타인의 영상을 본인이 촬영한 것처럼 제보하는 행위",
            "허위 사고 상황을 연출·조작하여 제보하는 행위",
            "동일 영상을 여러 계정으로 중복 제보하는 행위",
            "서비스 시스템에 부하를 주거나 정상 운영을 방해하는 행위",
            "다른 이용자의 개인정보를 무단으로 수집·이용하는 행위",
          ]}
        />
        <p className="mt-2">
          위 금지 행위 위반 시 서비스 이용이 제한되거나 법적 책임을 질 수 있습니다.
        </p>
      </Section>

      <Section title="제8조 (서비스 면책)">
        <List
          items={[
            "서비스는 이용자가 제보한 영상의 진위·권리 관계에 대해 보증하지 않습니다.",
            "제보 영상으로 인한 저작권·초상권·개인정보 침해 분쟁은 제보자가 책임을 집니다.",
            "천재지변, 서버 장애 등 불가항력으로 인한 서비스 중단에 대해 책임을 지지 않습니다.",
          ]}
        />
      </Section>

      <Section title="제9조 (약관 변경)">
        <p>
          서비스는 약관을 변경할 경우 시행일 7일 전부터 서비스 내 공지를 통해 고지합니다.
          변경된 약관에 동의하지 않는 경우 서비스 이용을 중단하고 회원 탈퇴를 요청할 수 있습니다.
        </p>
      </Section>

      <Section title="제10조 (준거법 및 관할)">
        <p>
          이 약관은 대한민국 법률에 따라 해석되며, 서비스와 이용자 간 분쟁에 관한 소송의
          관할 법원은 민사소송법에 따릅니다.
        </p>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--text)" }}>
        {title}
      </h2>
      <div className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
        {children}
      </div>
    </section>
  );
}

function List({ items }: { items: string[] }) {
  return (
    <ul className="list-disc pl-5 flex flex-col gap-1 mt-1">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}
