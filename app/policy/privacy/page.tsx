export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-xl font-semibold mb-2" style={{ color: "var(--text)" }}>
        개인정보처리방침
      </h1>
      <p className="text-xs mb-10" style={{ color: "var(--text-muted)" }}>
        시행일: 2025년 6월 1일
      </p>

      <Section title="1. 개인정보 수집 항목 및 수집 방법">
        <p>100:0 연구소(이하 "서비스")는 다음의 개인정보를 수집합니다.</p>
        <Table
          headers={["구분", "수집 항목", "수집 방법"]}
          rows={[
            ["회원 가입", "이메일 주소, 닉네임, 프로필 이미지", "Google OAuth 연동"],
            ["영상 제보", "계좌번호, 은행명, 예금주", "제보 양식 직접 입력"],
            ["서비스 이용", "IP 주소, 브라우저 정보(UA), 접속 일시", "자동 수집"],
            ["동의 기록", "동의 항목별 체크 여부, 파일 해시, IP, UA", "자동 수집"],
          ]}
        />
      </Section>

      <Section title="2. 개인정보 수집 및 이용 목적">
        <List
          items={[
            "회원 식별 및 서비스 제공",
            "영상 채택 시 보상금(5,000원/건) 지급",
            "법적 분쟁 발생 시 근거 자료 보존 (동의 기록)",
            "서비스 운영·통계 분석 (비식별 처리 후)",
          ]}
        />
      </Section>

      <Section title="3. 개인정보 보유 및 이용 기간">
        <Table
          headers={["항목", "보유 기간", "근거"]}
          rows={[
            ["회원 정보", "회원 탈퇴 시까지", "서비스 제공 목적 달성"],
            ["계좌정보", "지급 완료 후 5년", "전자금융거래법"],
            ["동의 기록", "제보 접수일로부터 5년", "분쟁 해결 및 소명"],
            ["서비스 이용 기록", "6개월", "통신비밀보호법"],
          ]}
        />
      </Section>

      <Section title="4. 개인정보 처리 위탁">
        <Table
          headers={["수탁 업체", "위탁 업무"]}
          rows={[
            ["Cloudflare, Inc.", "제출 영상 파일 저장 (R2 스토리지)"],
            ["Resend, Inc.", "이메일 발송 (접수 확인, 결과 안내)"],
          ]}
        />
        <p className="mt-2">위탁업체는 위탁된 업무 수행 목적 외 개인정보를 이용하지 않습니다.</p>
      </Section>

      <Section title="5. 개인정보의 제3자 제공">
        <p>서비스는 이용자의 개인정보를 제3자에게 제공하지 않습니다. 다만, 아래의 경우는 예외입니다.</p>
        <List
          items={[
            "이용자가 사전에 동의한 경우",
            "법령의 규정에 의거하거나 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우",
          ]}
        />
      </Section>

      <Section title="6. 정보주체의 권리">
        <p>이용자는 언제든지 다음의 권리를 행사할 수 있습니다.</p>
        <List
          items={[
            "개인정보 열람 요청",
            "개인정보 정정·삭제 요청",
            "개인정보 처리 정지 요청",
            "회원 탈퇴 (서비스 내 탈퇴 기능 또는 이메일 요청)",
          ]}
        />
        <p className="mt-2">
          단, 지급 관련 계좌정보는 법령에 따라 일정 기간 보관 후 삭제됩니다.
        </p>
      </Section>

      <Section title="7. 쿠키 및 자동 수집 항목">
        <p>서비스는 로그인 상태 유지를 위해 브라우저 localStorage에 인증 토큰을 저장합니다. 별도의 추적 쿠키나 광고 쿠키는 사용하지 않습니다.</p>
      </Section>

      <Section title="8. 개인정보 보호 책임자">
        <Table
          headers={["항목", "내용"]}
          rows={[
            ["서비스명", "100:0 연구소"],
            ["문의", "thewoowon@gmail.com"],
          ]}
        />
        <p className="mt-2">
          개인정보 처리에 관한 불만·침해 신고는{" "}
          <a
            href="https://privacy.go.kr"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "var(--text)", textDecoration: "underline" }}
          >
            개인정보보호위원회
          </a>
          에 접수하실 수 있습니다.
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

function Table({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto mt-2">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr style={{ borderBottom: "1px solid var(--border)" }}>
            {headers.map((h) => (
              <th
                key={h}
                className="text-left py-2 pr-4 font-medium"
                style={{ color: "var(--text)" }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
              {row.map((cell, j) => (
                <td key={j} className="py-2 pr-4 align-top">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
